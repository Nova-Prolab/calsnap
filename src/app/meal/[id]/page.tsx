
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ChevronLeft, Edit3, Save, CheckCircle, Utensils, AlertTriangle, Sparkles, X, Trash2, Heart, MoreVertical, RotateCcw } from 'lucide-react';
import { AppWrapper } from '@/components/AppWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { Meal, MealIngredient } from '@/types';
import { getFromLocalStorage, setToLocalStorage } from '@/lib/localStorage';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from '@/lib/utils';

interface EditableMealData {
  calories: string;
  protein: string;
  fat: string;
  carbohydrates: string;
  name: string;
  ingredients: MealIngredient[];
  healthScore: string;
  isFavorite: boolean;
}

export default function MealDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  
  const mealId = typeof params.id === 'string' ? params.id : undefined;

  const [meal, setMeal] = useState<Meal | null>(null);
  const [editableData, setEditableData] = useState<EditableMealData | null>(null);
  const [initialEditableData, setInitialEditableData] = useState<EditableMealData | null>(null);
  const [editingField, setEditingField] = useState<keyof Omit<EditableMealData, 'ingredients' | 'healthScore' | 'isFavorite'> | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [isClientReady, setIsClientReady] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    setIsClientReady(true);
  }, []);

  useEffect(() => {
    if (mealId && isClientReady) {
      const storedMeals = getFromLocalStorage<Meal[]>('calSnapMeals', []);
      const currentMeal = storedMeals.find(m => m.id === mealId);
      if (currentMeal) {
        setMeal(currentMeal);
        const currentEditableData = {
          name: currentMeal.name || '',
          calories: currentMeal.calories.toString(),
          protein: currentMeal.protein.toString(),
          fat: currentMeal.fat.toString(),
          carbohydrates: currentMeal.carbohydrates.toString(),
          ingredients: currentMeal.ingredients || [],
          healthScore: currentMeal.healthScore?.toString() ?? 'N/A',
          isFavorite: currentMeal.isFavorite || false,
        };
        setEditableData(currentEditableData);
        setInitialEditableData(currentEditableData);
      } else {
        setMeal(null); 
        setEditableData(null);
        setInitialEditableData(null);
      }
    }
  }, [mealId, isClientReady]); 

  const handleEdit = (field: keyof Omit<EditableMealData, 'ingredients' | 'healthScore' | 'isFavorite'>) => {
    setEditingField(field);
  };

  const handleInputChange = (field: keyof Omit<EditableMealData, 'ingredients' | 'healthScore' | 'isFavorite'>, value: string) => {
    if (editableData) {
      setEditableData({ ...editableData, [field]: value });
      setHasChanges(true);
    }
  };
  
  const handleToggleFavorite = () => {
    if (editableData) {
      setEditableData(prev => prev ? { ...prev, isFavorite: !prev.isFavorite } : null);
      setHasChanges(true);
    }
  };

  const handleSaveField = (field: keyof Omit<EditableMealData, 'ingredients' | 'healthScore' | 'isFavorite'>) => {
    if (!meal || !editableData) return;

    const updatedMealData = { ...editableData }; 

    let valid = true;
    let numericValue: number | undefined = undefined;

    if (field !== 'name') {
      numericValue = parseFloat(updatedMealData[field as keyof Omit<EditableMealData, 'name' | 'ingredients' | 'healthScore' | 'isFavorite'>]);
      if (isNaN(numericValue) || numericValue < 0) {
        toast({ variant: "destructive", title: "Invalid Value", description: `Please enter a valid non-negative number for ${field}.`});
        const originalValue = meal[field as keyof Meal] ?? (initialEditableData?.[field as keyof EditableMealData] ?? '');
        setEditableData(prev => prev ? {...prev, [field]: originalValue.toString()} : null);
        valid = false;
      }
    }
    
    if (valid) {
      setEditableData(updatedMealData);
      setEditingField(null);
      setHasChanges(true); 
    }
  };

  const handleDeleteIngredient = (indexToDelete: number) => {
    if (editableData) {
      const updatedIngredients = editableData.ingredients.filter((_, index) => index !== indexToDelete);
      setEditableData(prev => prev ? { ...prev, ingredients: updatedIngredients } : null);
      setHasChanges(true);
    }
  };
  
  const handleGlobalSave = () => {
    if (!meal || !editableData) return;

    const numCalories = parseFloat(editableData.calories);
    const numProtein = parseFloat(editableData.protein);
    const numFat = parseFloat(editableData.fat);
    const numCarbs = parseFloat(editableData.carbohydrates);
    const numHealthScore = editableData.healthScore !== 'N/A' ? parseFloat(editableData.healthScore) : undefined;


    if (isNaN(numCalories) || numCalories < 0 ||
        isNaN(numProtein) || numProtein < 0 ||
        isNaN(numFat) || numFat < 0 ||
        isNaN(numCarbs) || numCarbs < 0 ||
        (numHealthScore !== undefined && (isNaN(numHealthScore) || numHealthScore < 0 || numHealthScore > 10))) {
      toast({ variant: "destructive", title: "Invalid Data", description: "One or more nutritional values are invalid."});
      return;
    }

    const finalMeal: Meal = {
      ...meal,
      name: editableData.name,
      calories: numCalories,
      protein: numProtein,
      fat: numFat,
      carbohydrates: numCarbs,
      ingredients: editableData.ingredients,
      healthScore: numHealthScore,
      isFavorite: editableData.isFavorite,
    };
    
    setMeal(finalMeal);
    const storedMeals = getFromLocalStorage<Meal[]>('calSnapMeals', []);
    const updatedMeals = storedMeals.map(m => m.id === mealId ? finalMeal : m);
    setToLocalStorage('calSnapMeals', updatedMeals);
    
    setInitialEditableData(editableData); 
    setHasChanges(false);
    setEditingField(null); 
    toast({ title: "Changes Saved", description: "Meal details have been updated.", icon: <CheckCircle className="h-5 w-5 text-green-500" /> });
  };

  const handleDeleteMeal = () => {
    if (!mealId) return;
    const storedMeals = getFromLocalStorage<Meal[]>('calSnapMeals', []);
    const updatedMeals = storedMeals.filter(m => m.id !== mealId);
    setToLocalStorage('calSnapMeals', updatedMeals);
    toast({ title: "Meal Deleted", description: "The meal has been removed from your log.", icon: <Trash2 className="h-5 w-5 text-destructive" /> });
    router.push('/dashboard');
  };

  const handleRevertChanges = () => {
    if (initialEditableData) {
      setEditableData(initialEditableData);
      setHasChanges(false);
      setEditingField(null);
      toast({ title: "Changes Reverted", description: "Your unsaved changes have been discarded." });
    }
  };

  if (!isClientReady) {
    return (
      <AppWrapper className="bg-background text-foreground flex items-center justify-center">
        <p>Loading meal details...</p>
      </AppWrapper>
    );
  }

  if (!mealId) {
    return (
      <AppWrapper className="bg-background text-foreground flex items-center justify-center p-6">
        <Card className="w-full max-w-md text-center">
            <CardHeader>
                <CardTitle>Invalid Meal ID</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground mb-4">The meal ID is missing from the URL.</p>
                <Button onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
            </CardContent>
        </Card>
      </AppWrapper>
    );
  }

  if (!meal || !editableData) { 
     return (
        <AppWrapper className="bg-background text-foreground flex items-center justify-center p-6">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <CardTitle className="flex items-center justify-center"><AlertTriangle className="mr-2 h-6 w-6 text-destructive" /> Meal Not Found</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground mb-4">The meal with ID <code className="bg-muted px-1 rounded">{mealId}</code> could not be found.</p>
                    <p className="text-sm text-muted-foreground mb-4">It might have been deleted or the link is incorrect.</p>
                    <Button onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
                </CardContent>
            </Card>
        </AppWrapper>
    );
  }
  
  const nutrientFields: { 
    key: keyof Omit<EditableMealData, 'name' | 'ingredients' | 'healthScore' | 'isFavorite'>; 
    label: string; 
    unit: string; 
    iconColor: string; 
    iconInitial: string; 
    explanationKey: keyof Meal; 
    defaultExplanation: string;
  }[] = [
    { 
      key: 'calories', 
      label: 'Calories', 
      unit: 'kcal', 
      iconColor: 'bg-primary', 
      iconInitial: 'C', 
      explanationKey: 'calorieExplanation', 
      defaultExplanation: "Calories are a measure of energy. Your body needs them to function. This is the total estimated energy from this meal." 
    },
    { 
      key: 'protein', 
      label: 'Protein', 
      unit: 'g', 
      iconColor: 'bg-chart-1', 
      iconInitial: 'P', 
      explanationKey: 'proteinExplanation', 
      defaultExplanation: "Protein is essential for building and repairing tissues, like muscles. It also helps you feel full. This is the estimated amount of protein in this meal." },
    { 
      key: 'fat', 
      label: 'Fat', 
      unit: 'g', 
      iconColor: 'bg-chart-4', 
      iconInitial: 'F', 
      explanationKey: 'fatExplanation', 
      defaultExplanation: "Fats are a source of energy and help absorb certain vitamins. Healthy fats are important for brain health. This is the estimated amount of fat in this meal." },
    { 
      key: 'carbohydrates', 
      label: 'Carbs', 
      unit: 'g', 
      iconColor: 'bg-chart-3', 
      iconInitial: 'C', 
      explanationKey: 'carbohydratesExplanation', 
      defaultExplanation: "Carbohydrates are your body's main source of fuel, especially for your brain and during exercise. This is the estimated amount of carbs in this meal." },
  ];

  const defaultHealthScoreExplanation = "The Health Score (0-10) is an AI-generated estimate of this meal's nutritional quality, considering factors like ingredient balance and processing. A higher score suggests a healthier meal.";


  return (
    <AppWrapper className="bg-background">
      <header className="p-4 flex items-center justify-between border-b sticky top-0 bg-background z-10">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-2">
          <ChevronLeft size={28} />
          <span className="sr-only">Back</span>
        </Button>
        <h1 className="text-xl font-bold font-headline truncate flex-grow">
          {editingField === 'name' ? (
            <Input
              type="text"
              value={editableData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              onBlur={() => handleSaveField('name')}
              autoFocus
              className="text-xl font-bold font-headline h-auto p-0 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          ) : (
            <span onClick={() => handleEdit('name')} className="cursor-pointer hover:opacity-75">
              {editableData.name || "Unnamed Meal"}
            </span>
          )}
        </h1>
        <div className="flex items-center ml-2">
            {editingField !== 'name' && (
                <Button variant="ghost" size="icon" onClick={() => handleEdit('name')} className="h-9 w-9">
                    <Edit3 size={18} />
                </Button>
            )}
            <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleToggleFavorite} 
                className="h-9 w-9 transform active:scale-110 transition-transform duration-150 ease-out focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:bg-transparent"
                aria-label={editableData.isFavorite ? "Unmark as favorite" : "Mark as favorite"}
            >
                <Heart size={20} className={cn(editableData.isFavorite ? "fill-red-500 text-red-500" : "text-foreground")} />
            </Button>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9">
                        <MoreVertical size={20} />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => setIsDeleteDialogOpen(true)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Meal
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={handleRevertChanges} disabled={!hasChanges}>
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Revert Changes
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </header>

      <main className="flex-grow overflow-y-auto pb-20">
        {meal.photoDataUri && (
          <div className="relative w-full h-72 shadow-lg">
            <Image src={meal.photoDataUri} alt={editableData.name || "Meal image"} layout="fill" objectFit="cover" priority />
          </div>
        )}
        
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {nutrientFields.map(({ key, label, unit, iconColor, iconInitial, explanationKey, defaultExplanation }, index) => (
              <Card key={key} className="shadow-md rounded-xl">
                <CardContent className="p-3">
                  <Label className="text-xs text-muted-foreground mb-1 block">{label}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <div className="flex items-center justify-between cursor-pointer group">
                        <div className="flex items-center">
                          <div className={`w-7 h-7 rounded-full ${iconColor} flex items-center justify-center text-primary-foreground font-semibold text-xs mr-2`}>
                            {iconInitial}
                          </div>
                          {editingField === key ? (
                            <Input
                              type="number"
                              value={editableData[key]}
                              onChange={(e) => handleInputChange(key, e.target.value)}
                              onBlur={() => handleSaveField(key)}
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                              className="w-20 text-left text-md font-semibold h-auto p-1"
                              min="0"
                            />
                          ) : (
                            <span className="text-md font-semibold group-hover:opacity-75">
                              {editableData[key]}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground ml-1">{unit}</span>
                        </div>
                        {editingField !== key && (
                          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleEdit(key); }} className="h-7 w-7 text-muted-foreground hover:text-foreground">
                            <Edit3 size={14} />
                          </Button>
                        )}
                      </div>
                    </PopoverTrigger>
                    <PopoverContent 
                        side="bottom" 
                        align={index % 2 === 0 ? 'start' : 'end'} 
                        className="w-64 text-sm shadow-xl"
                        sideOffset={5}
                    >
                      <h4 className="font-semibold mb-1">{label}</h4>
                      <p className="text-muted-foreground">{meal[explanationKey] || defaultExplanation}</p>
                    </PopoverContent>
                  </Popover>
                </CardContent>
              </Card>
            ))}
            <Card className="shadow-md rounded-xl">
              <CardContent className="p-3">
                <Label className="text-xs text-muted-foreground mb-1 block">Health Score</Label>
                 <Popover>
                    <PopoverTrigger asChild>
                        <div className="flex items-center cursor-pointer group">
                            <div className={`w-7 h-7 rounded-full bg-pink-500 flex items-center justify-center text-primary-foreground font-semibold text-xs mr-2`}>
                                <Heart size={14} className="fill-white" />
                            </div>
                            <span className="text-md font-semibold group-hover:opacity-75">
                                {editableData.healthScore !== 'N/A' ? `${editableData.healthScore} / 10` : 'N/A'}
                            </span>
                        </div>
                    </PopoverTrigger>
                    <PopoverContent 
                        side="top" 
                        align="start" 
                        className="w-64 text-sm shadow-xl"
                        sideOffset={5}
                    >
                        <h4 className="font-semibold mb-1">Health Score</h4>
                        <p className="text-muted-foreground">{meal.healthScoreExplanation || defaultHealthScoreExplanation}</p>
                    </PopoverContent>
                </Popover>
              </CardContent>
            </Card>
          </div>


          {editableData.ingredients && editableData.ingredients.length > 0 && (
            <Card className="shadow-md rounded-xl">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-lg font-headline flex items-center">
                  <Utensils className="mr-2 h-5 w-5 text-primary"/> Ingredients
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-2 px-4 pb-4">
                {editableData.ingredients.map((ingredient, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-secondary/30 rounded-md group transition-all hover:bg-secondary/50">
                    <span className="text-sm flex-grow">
                      {ingredient.name}
                      {ingredient.quantity && ingredient.unit && (
                        <span className="text-xs text-muted-foreground ml-1">
                          ({ingredient.quantity} {ingredient.unit})
                        </span>
                      )}
                    </span>
                    <div className='flex items-center shrink-0'>
                      {ingredient.calories !== undefined && (
                         <Badge variant="outline" className="text-xs mr-2">{ingredient.calories} kcal</Badge>
                      )}
                      <Button variant="ghost" size="icon" 
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 focus:opacity-100 text-destructive hover:text-destructive/80" 
                              onClick={() => handleDeleteIngredient(index)}>
                        <X size={16} />
                        <span className="sr-only">Remove ingredient</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          <Button variant="outline" className="w-full">
            <Sparkles className="mr-2 h-4 w-4" /> Fix Result (Re-estimate with AI)
          </Button>
        </div>
      </main>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete this meal
                  from your log.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteMeal} className="bg-destructive hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
      </AlertDialog>

      {hasChanges && (
        <footer className="p-4 border-t bg-background sticky bottom-0 z-10">
          <Button onClick={handleGlobalSave} size="lg" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
            <Save className="mr-2 h-5 w-5" /> Save All Changes
          </Button>
        </footer>
      )}
    </AppWrapper>
  );
}

