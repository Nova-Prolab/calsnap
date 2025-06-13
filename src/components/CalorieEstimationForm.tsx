
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Camera, Loader2, Send, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { estimateMealCalories, type EstimateMealCaloriesOutput } from '@/ai/flows/estimate-meal-calories';
import type { Meal } from '@/types';
import { setToLocalStorage, getFromLocalStorage } from '@/lib/localStorage';

interface EditableMealData {
  name: string;
  calories: string;
  protein: string;
  fat: string;
  carbohydrates: string;
}

export function CalorieEstimationForm() {
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoDataUri, setPhotoDataUri] = useState<string | null>(null);
  const [estimationResult, setEstimationResult] = useState<EstimateMealCaloriesOutput | null>(null);
  const [editableData, setEditableData] = useState<EditableMealData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (estimationResult) {
      setEditableData({
        name: estimationResult.suggestedName || '',
        calories: estimationResult.calorieEstimate.toFixed(0),
        protein: estimationResult.macronutrientBreakdown.protein.toFixed(1),
        fat: estimationResult.macronutrientBreakdown.fat.toFixed(1),
        carbohydrates: estimationResult.macronutrientBreakdown.carbohydrates.toFixed(1),
      });
    } else {
      setEditableData(null);
    }
  }, [estimationResult]);

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
      setEstimationResult(null); 
      setEditableData(null);
    }
  };

  const handleEstimate = async () => {
    if (!photoDataUri) {
      toast({ title: "No photo selected", description: "Please upload a photo of your meal.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    setEstimationResult(null);
    setEditableData(null);
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

  const handleInputChange = (field: keyof EditableMealData, value: string) => {
    if (editableData) {
      setEditableData(prev => prev ? { ...prev, [field]: value } : null);
    }
  };

  const handleLogMeal = () => {
    if (!editableData) {
      toast({ title: "No Estimation Data", description: "Please estimate calories first.", variant: "destructive" });
      return;
    }

    const calories = parseFloat(editableData.calories);
    const protein = parseFloat(editableData.protein);
    const fat = parseFloat(editableData.fat);
    const carbohydrates = parseFloat(editableData.carbohydrates);

    if (isNaN(calories) || isNaN(protein) || isNaN(fat) || isNaN(carbohydrates) ||
        calories < 0 || protein < 0 || fat < 0 || carbohydrates < 0) {
      toast({ title: "Invalid Nutritional Data", description: "Please ensure all nutritional values are valid numbers.", variant: "destructive" });
      return;
    }
    
    const newMeal: Meal = {
      id: new Date().toISOString(), 
      name: editableData.name || `Meal at ${new Date().toLocaleTimeString()}`,
      photoDataUri: photoPreview || undefined,
      calories,
      protein,
      fat,
      carbohydrates,
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

        {photoPreview && !estimationResult && !isLoading && (
          <Button onClick={handleEstimate} disabled={isLoading || !photoDataUri} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Estimate Calories
          </Button>
        )}
         {isLoading && (
            <div className="flex justify-center items-center">
                <Loader2 className="mr-2 h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Estimating...</p>
            </div>
        )}


        {editableData && estimationResult && (
          <div className="space-y-4 p-4 border rounded-lg bg-secondary/50">
            <div className="space-y-2">
              <Label htmlFor="meal-name" className="font-semibold text-md">Meal Name</Label>
              <Input 
                id="meal-name" 
                placeholder="e.g., Chicken Salad Lunch" 
                value={editableData.name} 
                onChange={(e) => handleInputChange('name', e.target.value)} 
                className="bg-card"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="calories" className="font-semibold text-md">Calories (kcal)</Label>
                <Input 
                  id="calories" 
                  type="number"
                  value={editableData.calories} 
                  onChange={(e) => handleInputChange('calories', e.target.value)} 
                  className="bg-card"
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="protein" className="font-semibold text-md">Protein (g)</Label>
                <Input 
                  id="protein" 
                  type="number"
                  value={editableData.protein} 
                  onChange={(e) => handleInputChange('protein', e.target.value)} 
                  className="bg-card"
                  step="0.1"
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fat" className="font-semibold text-md">Fat (g)</Label>
                <Input 
                  id="fat" 
                  type="number"
                  value={editableData.fat} 
                  onChange={(e) => handleInputChange('fat', e.target.value)} 
                  className="bg-card"
                  step="0.1"
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="carbohydrates" className="font-semibold text-md">Carbs (g)</Label>
                <Input 
                  id="carbohydrates" 
                  type="number"
                  value={editableData.carbohydrates} 
                  onChange={(e) => handleInputChange('carbohydrates', e.target.value)} 
                  className="bg-card"
                  step="0.1"
                  min="0"
                />
              </div>
            </div>
             <Button onClick={handleEstimate} disabled={isLoading || !photoDataUri} className="w-full bg-primary/80 hover:bg-primary/70 text-primary-foreground text-sm py-2" size="sm">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Re-Estimate with AI
            </Button>
          </div>
        )}
      </CardContent>
      {editableData && estimationResult && (
        <CardFooter>
          <Button onClick={handleLogMeal} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
            <Edit3 className="mr-2 h-4 w-4" /> Log This Meal
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

