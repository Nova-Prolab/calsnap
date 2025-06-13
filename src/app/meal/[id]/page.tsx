
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, Edit3, Save, CheckCircle, AlertTriangle } from 'lucide-react';
import { AppWrapper } from '@/components/AppWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { Meal } from '@/types';
import { getFromLocalStorage, setToLocalStorage } from '@/lib/localStorage';

interface EditableMealField {
  calories: string;
  protein: string;
  fat: string;
  carbohydrates: string;
  name: string;
}

export default function MealDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  
  const mealId = typeof params.id === 'string' ? params.id : undefined;

  const [meal, setMeal] = useState<Meal | null>(null);
  const [editableData, setEditableData] = useState<EditableMealField | null>(null);
  const [editingField, setEditingField] = useState<keyof EditableMealField | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (mealId) {
      const storedMeals = getFromLocalStorage<Meal[]>('calSnapMeals', []);
      const currentMeal = storedMeals.find(m => m.id === mealId);
      if (currentMeal) {
        setMeal(currentMeal);
        setEditableData({
          name: currentMeal.name || '',
          calories: currentMeal.calories.toString(),
          protein: currentMeal.protein.toString(),
          fat: currentMeal.fat.toString(),
          carbohydrates: currentMeal.carbohydrates.toString(),
        });
      } else {
        toast({ variant: "destructive", title: "Meal not found", description: "Could not find the specified meal." });
        router.push('/dashboard');
      }
    }
  }, [mealId, router, toast]);

  const handleEdit = (field: keyof EditableMealField) => {
    setEditingField(field);
  };

  const handleInputChange = (field: keyof EditableMealField, value: string) => {
    if (editableData) {
      setEditableData({ ...editableData, [field]: value });
      setHasChanges(true);
    }
  };

  const handleSaveField = (field: keyof EditableMealField) => {
    if (!meal || !editableData) return;

    const updatedMeal = { ...meal };
    let valid = true;

    if (field === 'name') {
      updatedMeal.name = editableData.name;
    } else {
      const numericValue = parseFloat(editableData[field]);
      if (isNaN(numericValue) || numericValue < 0) {
        toast({ variant: "destructive", title: "Invalid Value", description: `Please enter a valid non-negative number for ${field}.`});
        // Revert to original value if invalid
        setEditableData(prev => prev ? {...prev, [field]: meal[field as keyof Meal].toString()} : null);
        valid = false;
      } else {
         // Type assertion needed as field can be 'name' which is not a numeric property of Meal
        (updatedMeal as any)[field] = numericValue;
      }
    }
    
    if (valid) {
      setMeal(updatedMeal);
      const storedMeals = getFromLocalStorage<Meal[]>('calSnapMeals', []);
      const updatedMeals = storedMeals.map(m => m.id === mealId ? updatedMeal : m);
      setToLocalStorage('calSnapMeals', updatedMeals);
      setEditingField(null);
      // Don't reset hasChanges here, wait for global save.
    }
  };
  
  const handleGlobalSave = () => {
    if (!meal || !editableData) return;

    const numCalories = parseFloat(editableData.calories);
    const numProtein = parseFloat(editableData.protein);
    const numFat = parseFloat(editableData.fat);
    const numCarbs = parseFloat(editableData.carbohydrates);

    if (isNaN(numCalories) || numCalories < 0 ||
        isNaN(numProtein) || numProtein < 0 ||
        isNaN(numFat) || numFat < 0 ||
        isNaN(numCarbs) || numCarbs < 0) {
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
    };
    
    setMeal(finalMeal);
    const storedMeals = getFromLocalStorage<Meal[]>('calSnapMeals', []);
    const updatedMeals = storedMeals.map(m => m.id === mealId ? finalMeal : m);
    setToLocalStorage('calSnapMeals', updatedMeals);
    
    setHasChanges(false);
    setEditingField(null); // Close any open input field
    toast({ title: "Changes Saved", description: "Meal details have been updated.", icon: <CheckCircle className="h-5 w-5 text-green-500" /> });
  };


  if (!meal || !editableData) {
    return (
      <AppWrapper className="bg-card text-card-foreground flex items-center justify-center">
        <p>Loading meal details...</p>
      </AppWrapper>
    );
  }
  
  const nutrientFields: { key: keyof Omit<EditableMealField, 'name'>; label: string; unit: string, iconColor: string, iconInitial: string }[] = [
    { key: 'calories', label: 'Calories', unit: 'kcal', iconColor: 'bg-primary', iconInitial: 'C' },
    { key: 'protein', label: 'Protein', unit: 'g', iconColor: 'bg-chart-1', iconInitial: 'P' },
    { key: 'fat', label: 'Fat', unit: 'g', iconColor: 'bg-chart-4', iconInitial: 'F' },
    { key: 'carbohydrates', label: 'Carbs', unit: 'g', iconColor: 'bg-chart-3', iconInitial: 'C' },
  ];


  return (
    <AppWrapper className="bg-background">
      <header className="p-4 flex items-center border-b sticky top-0 bg-background z-10">
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
        {editingField !== 'name' && (
            <Button variant="ghost" size="icon" onClick={() => handleEdit('name')} className="ml-2">
                <Edit3 size={20} />
            </Button>
        )}
      </header>

      <main className="flex-grow overflow-y-auto">
        {meal.photoDataUri && (
          <div className="relative w-full h-72 shadow-lg">
            <Image src={meal.photoDataUri} alt={editableData.name || "Meal image"} layout="fill" objectFit="cover" priority />
          </div>
        )}
        
        <div className="p-4 space-y-4">
          {nutrientFields.map(({ key, label, unit, iconColor, iconInitial }) => (
            <Card key={key} className="shadow-md rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full ${iconColor} flex items-center justify-center text-primary-foreground font-semibold text-sm mr-3`}>
                      {iconInitial}
                    </div>
                    <span className="text-md font-medium text-muted-foreground">{label}</span>
                  </div>
                  <div className="flex items-center">
                    {editingField === key ? (
                      <Input
                        type="number"
                        value={editableData[key]}
                        onChange={(e) => handleInputChange(key, e.target.value)}
                        onBlur={() => handleSaveField(key)}
                        autoFocus
                        className="w-24 text-right text-lg font-semibold h-auto p-1"
                        min="0"
                      />
                    ) : (
                      <span onClick={() => handleEdit(key)} className="text-lg font-semibold cursor-pointer hover:opacity-75">
                        {editableData[key]}
                      </span>
                    )}
                    <span className="text-sm text-muted-foreground ml-1 mr-2">{unit}</span>
                    {editingField !== key && (
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(key)} className="h-8 w-8">
                            <Edit3 size={16} />
                        </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
      
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
