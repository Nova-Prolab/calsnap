
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image'; // For placeholder or future image display
import { useRouter } from 'next/navigation';
import { ChevronLeft, Loader2, Send, Save, Utensils, X, Heart, Edit3 } from 'lucide-react';
import { AppWrapper } from '@/components/AppWrapper';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { estimateMealCaloriesFromText } from '@/ai/flows/estimate-meal-calories-from-text';
import type { EstimateMealCaloriesOutput } from '@/ai/flows/estimate-meal-calories';
import type { Meal, MealIngredient } from '@/types';
import { setToLocalStorage, getFromLocalStorage } from '@/lib/localStorage';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';


interface EditableMealData {
  name: string;
  calories: string;
  protein: string;
  fat: string;
  carbohydrates: string;
  ingredients?: MealIngredient[];
  healthScore?: string;
}

export default function DescribeMealPage() {
  const [description, setDescription] = useState('');
  const [estimationResult, setEstimationResult] = useState<EstimateMealCaloriesOutput | null>(null);
  const [editableData, setEditableData] = useState<EditableMealData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  React.useEffect(() => {
    if (estimationResult) {
      setEditableData({
        name: estimationResult.suggestedName || '',
        calories: estimationResult.calorieEstimate.toFixed(0),
        protein: estimationResult.macronutrientBreakdown.protein.toFixed(1),
        fat: estimationResult.macronutrientBreakdown.fat.toFixed(1),
        carbohydrates: estimationResult.macronutrientBreakdown.carbohydrates.toFixed(1),
        ingredients: estimationResult.ingredients || [],
        healthScore: estimationResult.healthScore?.toString() || '',
      });
    } else {
      setEditableData(null);
    }
  }, [estimationResult]);

  const handleEstimate = async () => {
    if (!description.trim()) {
      toast({ title: "No description provided", description: "Please describe your meal.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    setEstimationResult(null);
    setEditableData(null);
    try {
      const result = await estimateMealCaloriesFromText({ description });
      setEstimationResult(result);
    } catch (error) {
      console.error("Error estimating calories from text:", error);
      toast({ title: "Estimation Failed", description: "Could not estimate calories. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleInputChange = (field: keyof Omit<EditableMealData, 'ingredients' | 'healthScore'>, value: string) => {
    if (editableData) {
      setEditableData(prev => prev ? { ...prev, [field]: value } : null);
    }
  };

  const handleDeleteIngredient = (indexToDelete: number) => {
    if (editableData && editableData.ingredients) {
      const updatedIngredients = editableData.ingredients.filter((_, index) => index !== indexToDelete);
      setEditableData(prev => prev ? { ...prev, ingredients: updatedIngredients } : null);
    }
  };


  const handleLogMeal = () => {
    if (!editableData || !estimationResult) {
      toast({ title: "No Estimation Data", description: "Please estimate calories first.", variant: "destructive" });
      return;
    }

    const calories = parseFloat(editableData.calories);
    const protein = parseFloat(editableData.protein);
    const fat = parseFloat(editableData.fat);
    const carbohydrates = parseFloat(editableData.carbohydrates);
    const healthScore = editableData.healthScore ? parseFloat(editableData.healthScore) : undefined;

    if (isNaN(calories) || isNaN(protein) || isNaN(fat) || isNaN(carbohydrates) ||
        calories < 0 || protein < 0 || fat < 0 || carbohydrates < 0 ||
        (healthScore !== undefined && (isNaN(healthScore) || healthScore < 0 || healthScore > 10))) {
      toast({ title: "Invalid Nutritional Data", description: "Please ensure all nutritional values are valid.", variant: "destructive" });
      return;
    }
    
    const mealId = crypto.randomUUID();
    const newMeal: Meal = {
      id: mealId,
      name: editableData.name || `Meal at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      description: description, // Save the original description
      calories,
      protein,
      fat,
      carbohydrates,
      timestamp: Date.now(),
      ingredients: editableData.ingredients || [],
      healthScore: estimationResult.healthScore,
      isFavorite: false,
      calorieExplanation: estimationResult.calorieExplanation,
      proteinExplanation: estimationResult.proteinExplanation,
      fatExplanation: estimationResult.fatExplanation,
      carbohydratesExplanation: estimationResult.carbohydratesExplanation,
      healthScoreExplanation: estimationResult.healthScoreExplanation,
    };

    const existingMeals = getFromLocalStorage<Meal[]>('calSnapMeals', []);
    setToLocalStorage('calSnapMeals', [...existingMeals, newMeal]);
    
    toast({ title: "Meal Logged!", description: `${newMeal.calories} kcal added. Viewing details...`});
    router.push(`/meal/${mealId}`);
  };


  return (
    <AppWrapper className="bg-card text-card-foreground">
      <header className="p-6 flex items-center border-b sticky top-0 bg-card z-10">
        <Link href="/dashboard" className="text-muted-foreground hover:text-foreground mr-4">
          <ChevronLeft size={28} />
          <span className="sr-only">Back to Dashboard</span>
        </Link>
        <h1 className="text-2xl font-bold font-headline">Describe Your Meal</h1>
      </header>
      <main className="p-6 flex-grow">
        <Card className="w-full shadow-xl">
          <CardHeader>
            <CardTitle className="font-headline text-xl">Tell us about your meal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="meal-description" className="font-semibold">Meal Description</Label>
              <Textarea
                id="meal-description"
                placeholder="e.g., 'Two slices of pepperoni pizza and a side salad with ranch dressing' or 'Chicken breast with roasted broccoli and quinoa'"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="mt-1 bg-background"
                disabled={isLoading || !!estimationResult}
              />
            </div>

            {!estimationResult && (
              <Button onClick={handleEstimate} disabled={isLoading || !description.trim()} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Estimate Calories
              </Button>
            )}
             {isLoading && !estimationResult && (
                <div className="space-y-4 p-4 border rounded-lg bg-secondary/30 animate-pulse">
                    <Skeleton className="h-6 w-3/4 bg-muted/70" />
                    <div className="grid grid-cols-2 gap-4">
                        <Skeleton className="h-10 w-full bg-muted/60" />
                        <Skeleton className="h-10 w-full bg-muted/60" />
                        <Skeleton className="h-10 w-full bg-muted/60" />
                        <Skeleton className="h-10 w-full bg-muted/60" />
                    </div>
                    <Skeleton className="h-8 w-1/2 bg-muted/50" />
                    <Skeleton className="h-20 w-full bg-muted/50" />
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
                    <Input id="calories" type="number" value={editableData.calories} onChange={(e) => handleInputChange('calories', e.target.value)} className="bg-card" min="0"/>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="protein" className="font-semibold text-md">Protein (g)</Label>
                    <Input id="protein" type="number" value={editableData.protein} onChange={(e) => handleInputChange('protein', e.target.value)} className="bg-card" step="0.1" min="0"/>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fat" className="font-semibold text-md">Fat (g)</Label>
                    <Input id="fat" type="number" value={editableData.fat} onChange={(e) => handleInputChange('fat', e.target.value)} className="bg-card" step="0.1" min="0"/>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="carbohydrates" className="font-semibold text-md">Carbs (g)</Label>
                    <Input id="carbohydrates" type="number" value={editableData.carbohydrates} onChange={(e) => handleInputChange('carbohydrates', e.target.value)} className="bg-card" step="0.1" min="0"/>
                  </div>
                </div>
                 {editableData.healthScore && (
                     <div className="space-y-2">
                        <Label htmlFor="health-score" className="font-semibold text-md flex items-center">
                            <Heart className="mr-2 h-4 w-4 text-pink-500" /> Health Score
                        </Label>
                        <Input id="health-score" type="text" value={`${editableData.healthScore} / 10`} readOnly className="bg-card text-muted-foreground"/>
                    </div>
                )}
                {editableData.ingredients && editableData.ingredients.length > 0 && (
                  <div>
                    <Label className="font-semibold text-md mb-2 block flex items-center"><Utensils className="mr-2 h-4 w-4 text-primary" /> Identified Ingredients</Label>
                    <div className="space-y-1 max-h-40 overflow-y-auto bg-card p-2 rounded-md border">
                      {editableData.ingredients.map((ing, index) => (
                        <div key={index} className="text-sm p-1.5 rounded bg-secondary/50 flex justify-between items-center group">
                           <span className="flex-grow">
                            {ing.name}
                            {ing.quantity && ing.unit && (<span className="text-xs text-muted-foreground ml-1">({ing.quantity} {ing.unit})</span>)}
                          </span>
                          <div className="flex items-center shrink-0">
                            {ing.calories !== undefined && (<Badge variant="outline" className="text-xs mr-1">{ing.calories} kcal</Badge>)}
                            <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100 focus:opacity-100 text-destructive hover:text-destructive/80" onClick={() => handleDeleteIngredient(index)}>
                              <X size={14} />
                              <span className="sr-only">Remove ingredient</span>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                    <Button onClick={() => { setEstimationResult(null); setEditableData(null); setIsLoading(false); }} variant="outline" className="w-full" disabled={isLoading}>
                        <Edit3 className="mr-2 h-4 w-4" /> Edit Description
                    </Button>
                    <Button onClick={handleEstimate} disabled={isLoading} className="w-full bg-primary/80 hover:bg-primary/70 text-primary-foreground text-sm py-2" size="sm">
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                        Re-Estimate
                    </Button>
                </div>
              </div>
            )}
          </CardContent>
          {editableData && estimationResult && (
            <CardFooter>
              <Button onClick={handleLogMeal} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                <Save className="mr-2 h-4 w-4" /> Log & View Details
              </Button>
            </CardFooter>
          )}
        </Card>
      </main>
    </AppWrapper>
  );
}
