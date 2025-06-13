'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Camera, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { estimateMealCalories, type EstimateMealCaloriesOutput } from '@/ai/flows/estimate-meal-calories';
import type { Meal } from '@/types';
import { setToLocalStorage, getFromLocalStorage } from '@/lib/localStorage';

export function CalorieEstimationForm() {
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoDataUri, setPhotoDataUri] = useState<string | null>(null);
  const [estimationResult, setEstimationResult] = useState<EstimateMealCaloriesOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mealName, setMealName] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const readerPreview = new FileReader();
      readerPreview.onloadend = () => {
        setPhotoPreview(readerPreview.result as string);
      };
      readerPreview.readAsDataURL(file);

      const readerDataUri = new FileReader();
      readerDataUri.onloadend = () => {
        setPhotoDataUri(readerDataUri.result as string);
      };
      readerDataUri.readAsDataURL(file);
      setEstimationResult(null); // Clear previous results
    }
  };

  const handleEstimate = async () => {
    if (!photoDataUri) {
      toast({ title: "No photo selected", description: "Please upload a photo of your meal.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    setEstimationResult(null);
    try {
      const result = await estimateMealCalories({ photoDataUri });
      setEstimationResult(result);
    } catch (error) {
      console.error("Error estimating calories:", error);
      toast({ title: "Estimation Failed", description: "Could not estimate calories. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogMeal = () => {
    if (!estimationResult) {
      toast({ title: "No Estimation Data", description: "Please estimate calories first.", variant: "destructive" });
      return;
    }
    const newMeal: Meal = {
      id: new Date().toISOString(), // Simple ID
      name: mealName || undefined,
      photoDataUri: photoPreview || undefined, // Store preview URI for display
      calories: estimationResult.calorieEstimate,
      protein: estimationResult.macronutrientBreakdown.protein,
      fat: estimationResult.macronutrientBreakdown.fat,
      carbohydrates: estimationResult.macronutrientBreakdown.carbohydrates,
      timestamp: Date.now(),
    };

    const existingMeals = getFromLocalStorage<Meal[]>('calSnapMeals', []);
    setToLocalStorage('calSnapMeals', [...existingMeals, newMeal]);
    
    toast({ title: "Meal Logged!", description: `${newMeal.calories} kcal added to your log.`});
    router.push('/dashboard');
  };

  return (
    <Card className="w-full shadow-xl">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Estimate & Log Meal</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="meal-photo" className="mb-2 block font-semibold">Meal Photo</Label>
          <div className="flex items-center justify-center w-full">
            <label
              htmlFor="meal-photo-input"
              className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-secondary hover:bg-muted border-border"
            >
              {photoPreview ? (
                <Image src={photoPreview} alt="Meal preview" width={150} height={150} className="object-contain h-full rounded-lg" />
              ) : (
                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-muted-foreground">
                  <Camera className="w-10 h-10 mb-3" />
                  <p className="mb-2 text-sm"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                  <p className="text-xs">SVG, PNG, JPG or GIF (MAX. 800x400px)</p>
                </div>
              )}
              <Input id="meal-photo-input" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
            </label>
          </div>
        </div>

        {photoPreview && (
          <Button onClick={handleEstimate} disabled={isLoading || !photoDataUri} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Estimate Calories
          </Button>
        )}

        {estimationResult && (
          <div className="space-y-4 p-4 border rounded-lg bg-secondary/50">
            <h3 className="font-semibold text-lg">Estimation:</h3>
            <p><strong>Calories:</strong> {estimationResult.calorieEstimate.toFixed(0)} kcal</p>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <p><strong>Protein:</strong> {estimationResult.macronutrientBreakdown.protein.toFixed(1)}g</p>
              <p><strong>Fat:</strong> {estimationResult.macronutrientBreakdown.fat.toFixed(1)}g</p>
              <p><strong>Carbs:</strong> {estimationResult.macronutrientBreakdown.carbohydrates.toFixed(1)}g</p>
            </div>
            <div>
              <Label htmlFor="meal-name" className="mb-1 block text-sm">Meal Name (Optional)</Label>
              <Input 
                id="meal-name" 
                placeholder="e.g., Chicken Salad Lunch" 
                value={mealName} 
                onChange={(e) => setMealName(e.target.value)} 
                className="bg-card"
              />
            </div>
          </div>
        )}
      </CardContent>
      {estimationResult && (
        <CardFooter>
          <Button onClick={handleLogMeal} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
            Log This Meal
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
