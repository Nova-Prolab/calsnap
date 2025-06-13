
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Camera, Loader2, Send, Edit3, Save, Utensils, X, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { estimateMealCalories, type EstimateMealCaloriesOutput } from '@/ai/flows/estimate-meal-calories';
import type { Meal, MealIngredient } from '@/types';
import { setToLocalStorage, getFromLocalStorage } from '@/lib/localStorage';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from '@/components/ui/badge';


interface EditableMealData {
  name: string;
  calories: string;
  protein: string;
  fat: string;
  carbohydrates: string;
  ingredients?: MealIngredient[];
  healthScore?: string;
}

export function CalorieEstimationForm() {
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoDataUri, setPhotoDataUri] = useState<string | null>(null);
  const [estimationResult, setEstimationResult] = useState<EstimateMealCaloriesOutput | null>(null);
  const [editableData, setEditableData] = useState<EditableMealData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [useCamera, setUseCamera] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
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

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const getCameraPermission = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      setHasCameraPermission(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasCameraPermission(false);
      toast({
        variant: 'destructive',
        title: 'Camera Access Denied',
        description: 'Please enable camera permissions in your browser settings.',
      });
      setUseCamera(false);
    }
  };

  const handleToggleCamera = () => {
    if (!useCamera) {
      setUseCamera(true);
      if (hasCameraPermission === null || hasCameraPermission === false) {
        getCameraPermission();
      }
    } else {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      setStream(null);
      setUseCamera(false);
      setPhotoPreview(null);
      setPhotoDataUri(null);
    }
  };
  
  const handleCapturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUri = canvas.toDataURL('image/jpeg');
        setPhotoPreview(dataUri);
        setPhotoDataUri(dataUri);
        setEstimationResult(null);
        setEditableData(null);

        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        setStream(null);
        setUseCamera(false); 
      }
    }
  };


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        setPhotoPreview(dataUri);
        setPhotoDataUri(dataUri);
        setEstimationResult(null); 
        setEditableData(null);
      };
      reader.readAsDataURL(file);
      if (useCamera && stream) { 
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
        setUseCamera(false);
      }
    }
  };

  const handleEstimate = async () => {
    if (!photoDataUri) {
      toast({ title: "No photo selected", description: "Please upload or take a photo of your meal.", variant: "destructive" });
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
    if (!editableData || !photoPreview || !estimationResult) { 
      toast({ title: "No Estimation Data", description: "Please estimate calories first and ensure a photo is present.", variant: "destructive" });
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
      toast({ title: "Invalid Nutritional Data", description: "Please ensure all nutritional values (including health score if present) are valid numbers.", variant: "destructive" });
      return;
    }
    
    const mealId = crypto.randomUUID();
    const newMeal: Meal = {
      id: mealId, 
      name: editableData.name || `Meal at ${new Date().toLocaleTimeString()}`,
      photoDataUri: photoPreview,
      calories,
      protein,
      fat,
      carbohydrates,
      timestamp: Date.now(),
      ingredients: editableData.ingredients || [],
      healthScore: estimationResult.healthScore, // Use original from AI
      isFavorite: false, // Default new meals are not favorite
    };

    const existingMeals = getFromLocalStorage<Meal[]>('calSnapMeals', []);
    setToLocalStorage('calSnapMeals', [...existingMeals, newMeal]);
    
    toast({ title: "Meal Logged!", description: `${newMeal.calories} kcal added. Viewing details...`});
    router.push(`/meal/${mealId}`);
  };

  return (
    <Card className="w-full shadow-xl">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Estimate & Log Meal</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-2">
            <Label htmlFor="meal-photo" className="font-semibold">Meal Photo</Label>
            <Button variant="outline" size="sm" onClick={handleToggleCamera}>
              <Camera className="mr-2 h-4 w-4" />
              {useCamera ? 'Close Camera' : 'Open Camera'}
            </Button>
          </div>

          {useCamera && (
            <div className="mb-4">
              <video ref={videoRef} className="w-full aspect-video rounded-md bg-secondary" autoPlay muted playsInline />
              <canvas ref={canvasRef} className="hidden"></canvas>
              {hasCameraPermission === false && (
                <Alert variant="destructive" className="mt-2">
                  <AlertTitle>Camera Access Required</AlertTitle>
                  <AlertDescription>
                    Please allow camera access in your browser settings to use this feature. You might need to refresh the page.
                  </AlertDescription>
                </Alert>
              )}
               {hasCameraPermission === true && !photoPreview && (
                 <Button onClick={handleCapturePhoto} className="w-full mt-2 bg-accent hover:bg-accent/90">
                    Capture Photo
                 </Button>
                )}
            </div>
          )}

          {!useCamera && (
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
                    <p className="text-xs">PNG, JPG, GIF</p>
                  </div>
                )}
                <Input id="meal-photo-input" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
              </label>
            </div>
          )}
        </div>

        {photoPreview && !estimationResult && !isLoading && (
          <Button onClick={handleEstimate} disabled={isLoading || !photoDataUri} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Estimate Calories
          </Button>
        )}
         {isLoading && (
            <div className="flex flex-col justify-center items-center p-4 border rounded-lg bg-secondary/30">
                <Loader2 className="mr-2 h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground mt-2">AI is estimating your meal...</p>
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
            {editableData.healthScore && (
                 <div className="space-y-2">
                    <Label htmlFor="health-score" className="font-semibold text-md flex items-center">
                        <Heart className="mr-2 h-4 w-4 text-pink-500" /> Health Score
                    </Label>
                    <Input 
                    id="health-score" 
                    type="text" // Display only, not directly editable from here
                    value={`${editableData.healthScore} / 10`} 
                    readOnly 
                    className="bg-card text-muted-foreground"
                    />
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
                        {ing.quantity && ing.unit && (
                          <span className="text-xs text-muted-foreground ml-1">
                            ({ing.quantity} {ing.unit})
                          </span>
                        )}
                      </span>
                      <div className="flex items-center shrink-0">
                        {ing.calories !== undefined && (
                          <Badge variant="outline" className="text-xs mr-1">{ing.calories} kcal</Badge>
                        )}
                        <Button variant="ghost" size="icon" 
                                className="h-5 w-5 opacity-0 group-hover:opacity-100 focus:opacity-100 text-destructive hover:text-destructive/80" 
                                onClick={() => handleDeleteIngredient(index)}>
                          <X size={14} />
                          <span className="sr-only">Remove ingredient</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
            <Save className="mr-2 h-4 w-4" /> Log & View Details
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
