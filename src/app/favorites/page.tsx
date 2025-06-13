
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, Heart, Utensils, AlertTriangle, Trash2, Loader2 } from 'lucide-react';
import { AppWrapper } from '@/components/AppWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { Meal } from '@/types';
import { getFromLocalStorage, setToLocalStorage } from '@/lib/localStorage';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
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

const MacroIcon = ({ letter, bgColorClass }: { letter: string; bgColorClass: string }) => (
  <div className={`w-5 h-5 rounded-full ${bgColorClass} flex items-center justify-center text-xs font-semibold text-primary-foreground mr-1.5`}>
    {letter}
  </div>
);

export default function FavoritesPage() {
  const [favoriteMeals, setFavoriteMeals] = useState<Meal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [mealToUnfavorite, setMealToUnfavorite] = useState<Meal | null>(null);
  const [isUnfavoriteDialogOpen, setIsUnfavoriteDialogOpen] = useState(false);

  useEffect(() => {
    const storedMeals = getFromLocalStorage<Meal[]>('calSnapMeals', []);
    setFavoriteMeals(storedMeals.filter(meal => meal.isFavorite).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)));
    setIsLoading(false);
  }, []);

  const handleToggleFavorite = (mealToUpdate: Meal) => {
    const updatedMeal = { ...mealToUpdate, isFavorite: !mealToUpdate.isFavorite };
    
    const storedMeals = getFromLocalStorage<Meal[]>('calSnapMeals', []);
    const updatedStoredMeals = storedMeals.map(m => m.id === updatedMeal.id ? updatedMeal : m);
    setToLocalStorage('calSnapMeals', updatedStoredMeals);

    if (!updatedMeal.isFavorite) { // If it was unfavorited
      setFavoriteMeals(prev => prev.filter(m => m.id !== updatedMeal.id));
      toast({ title: "Removed from Favorites", description: `${updatedMeal.name || 'Meal'} is no longer a favorite.`, icon: <Trash2 className="h-5 w-5 text-destructive" /> });
    } else { // Should not happen from this page directly, but good for consistency
       setFavoriteMeals(prev => [...prev, updatedMeal].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)));
       toast({ title: "Added to Favorites!", icon: <Heart className="h-5 w-5 text-red-500 fill-red-500" /> });
    }
    setIsUnfavoriteDialogOpen(false);
    setMealToUnfavorite(null);
  };

  const openUnfavoriteDialog = (meal: Meal) => {
    setMealToUnfavorite(meal);
    setIsUnfavoriteDialogOpen(true);
  };

  const logFavoriteMealForToday = (meal: Meal) => {
    const mealToLog: Meal = {
      ...meal,
      id: crypto.randomUUID(), // New ID for the new entry
      timestamp: Date.now(), // Set to current time
      isFavorite: meal.isFavorite, // Keep its favorite status
    };

    const existingMeals = getFromLocalStorage<Meal[]>('calSnapMeals', []);
    setToLocalStorage('calSnapMeals', [...existingMeals, mealToLog]);
    toast({
      title: "Meal Logged!",
      description: `${meal.name || 'Favorite meal'} (${meal.calories} kcal) added to today's log.`,
      icon: <Utensils className="h-5 w-5 text-primary" />,
    });
  };


  if (isLoading) {
    return (
      <AppWrapper className="bg-card text-card-foreground">
        <header className="p-6 flex items-center border-b sticky top-0 bg-card z-10">
          <Link href="/dashboard" className="text-muted-foreground hover:text-foreground mr-4">
            <ChevronLeft size={28} />
          </Link>
          <h1 className="text-2xl font-bold font-headline">Favorite Meals</h1>
        </header>
        <main className="p-6 flex-grow flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </main>
      </AppWrapper>
    );
  }
  
  return (
    <AppWrapper className="bg-card text-card-foreground">
      <header className="p-6 flex items-center border-b sticky top-0 bg-card z-10">
        <Link href="/dashboard" className="text-muted-foreground hover:text-foreground mr-4">
          <ChevronLeft size={28} />
          <span className="sr-only">Back to Dashboard</span>
        </Link>
        <h1 className="text-2xl font-bold font-headline">Favorite Meals</h1>
      </header>
      <main className="p-6 flex-grow">
        {favoriteMeals.length === 0 ? (
          <Card className="bg-secondary rounded-3xl p-8 text-center mt-10">
            <CardContent className="p-0 flex flex-col items-center">
              <Heart className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h4 className="text-lg font-bold mb-2">No Favorite Meals Yet!</h4>
              <p className="text-muted-foreground text-sm">Mark meals as favorites on their detail page to see them here.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {favoriteMeals.map(meal => (
              <Card key={meal.id} className="rounded-2xl shadow-md bg-background hover:shadow-lg transition-shadow">
                <div className="p-3 flex items-stretch space-x-3">
                  <Link href={`/meal/${meal.id}`} className="flex-shrink-0">
                    {meal.photoDataUri ? (
                      <div className="w-20 h-20 relative rounded-lg overflow-hidden">
                        <Image src={meal.photoDataUri} alt={meal.name || "Favorite meal"} layout="fill" className="object-cover" />
                      </div>
                    ) : (
                       <div className="w-20 h-20 relative rounded-lg overflow-hidden bg-secondary flex items-center justify-center">
                         <Utensils className="w-10 h-10 text-muted-foreground" />
                       </div>
                    )}
                  </Link>
                  <div className="flex-grow flex flex-col justify-between py-0.5 min-w-0">
                    <div>
                      <div className="flex justify-between items-center mb-0.5">
                        <Link href={`/meal/${meal.id}`} className="block flex-1 min-w-0 mr-2">
                            <p className="font-semibold text-sm leading-tight text-foreground truncate hover:underline">{meal.name || "Unnamed Meal"}</p>
                        </Link>
                        <Button variant="ghost" size="icon" onClick={() => openUnfavoriteDialog(meal)} className="h-7 w-7 text-red-500 hover:text-red-600 flex-shrink-0">
                           <Heart size={18} className="fill-current" />
                        </Button>
                      </div>
                       <Link href={`/meal/${meal.id}`} className="block">
                          <p className="text-lg font-bold text-primary">{meal.calories} Calories</p>
                       </Link>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-2 gap-2">
                        <div className="flex items-center space-x-2"> {/* Macro container */}
                            <div className="flex items-center">
                                <MacroIcon letter="P" bgColorClass="bg-chart-1" />
                                <span className="text-xs text-muted-foreground">{meal.protein}g</span>
                            </div>
                            <div className="flex items-center">
                                <MacroIcon letter="F" bgColorClass="bg-chart-4" />
                                <span className="text-xs text-muted-foreground">{meal.fat}g</span>
                            </div>
                            <div className="flex items-center">
                                <MacroIcon letter="C" bgColorClass="bg-chart-3" />
                                <span className="text-xs text-muted-foreground">{meal.carbohydrates}g</span>
                            </div>
                        </div>
                        <Button 
                            size="sm" 
                            variant="default" 
                            className="w-full sm:w-auto"
                            onClick={() => logFavoriteMealForToday(meal)}
                        >
                            <Utensils className="mr-2 h-4 w-4" /> Log for Today
                        </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
      <AlertDialog open={isUnfavoriteDialogOpen} onOpenChange={setIsUnfavoriteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from Favorites?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove "{mealToUnfavorite?.name || 'this meal'}" from your favorites?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setMealToUnfavorite(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => mealToUnfavorite && handleToggleFavorite(mealToUnfavorite)} className="bg-destructive hover:bg-destructive/90">
              Unfavorite
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppWrapper>
  );
}

