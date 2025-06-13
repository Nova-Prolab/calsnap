
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { User, Camera, Plus, AlertTriangle, Trash2, LibraryBig, PenSquare, Heart } from 'lucide-react';
import { AppWrapper } from '@/components/AppWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { Meal, DailyTotals, CalorieGoals } from '@/types';
import { getFromLocalStorage, setToLocalStorage } from '@/lib/localStorage';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
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
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";


const DayButton = ({ day, date, isActive, onClick }: { day: string; date: number; isActive: boolean; onClick: () => void }) => (
  <div className="text-center">
    <div className="text-sm text-muted-foreground mb-1">{day}</div>
    <Button
      onClick={onClick}
      variant={isActive ? 'default': 'ghost'}
      size="icon"
      className={`w-8 h-8 rounded-full text-sm ${isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}
    >
      {date}
    </Button>
  </div>
);

const MacroIcon = ({ letter, bgColorClass }: { letter: string; bgColorClass: string }) => (
  <div className={`w-5 h-5 rounded-full ${bgColorClass} flex items-center justify-center text-xs font-semibold text-primary-foreground mr-1.5`}>
    {letter}
  </div>
);

export default function DashboardScreen() {
  const [recentMeals, setRecentMeals] = useState<Meal[]>([]);
  const [dailyTotals, setDailyTotals] = useState<DailyTotals>({ calories: 0, protein: 0, fat: 0, carbohydrates: 0 });
  const [userGoals, setUserGoals] = useState<CalorieGoals>({ calories: 0, protein: 0, fat: 0, carbohydrates: 0 });
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLoadingGoals, setIsLoadingGoals] = useState(true);
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [mealToDeleteId, setMealToDeleteId] = useState<string | null>(null);
  
  const [selectedMealForDeletion, setSelectedMealForDeletion] = useState<string | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isAddMealSheetOpen, setIsAddMealSheetOpen] = useState(false);

  const { toast } = useToast();

  const calculateAndSetDailyTotals = (mealsForDate: Meal[]) => {
    const totals = mealsForDate.reduce((acc, meal) => {
      acc.calories += meal.calories;
      acc.protein += meal.protein;
      acc.fat += meal.fat;
      acc.carbohydrates += meal.carbohydrates;
      return acc;
    }, { calories: 0, protein: 0, fat: 0, carbohydrates: 0 });
    setDailyTotals(totals);
  };

  useEffect(() => {
    const storedGoals = getFromLocalStorage<CalorieGoals | null>('userCalorieGoals', null);
    if (storedGoals && storedGoals.calories > 0) { 
      setUserGoals(storedGoals);
    } else {
      setUserGoals({ calories: 0, protein: 0, fat: 0, carbohydrates: 0 });
    }
    setIsLoadingGoals(false);

    const storedMeals = getFromLocalStorage<Meal[]>('calSnapMeals', []);
    const selectedDateMeals = storedMeals.filter(meal => 
      format(new Date(meal.timestamp), 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd')
    );
    setRecentMeals(selectedDateMeals.sort((a,b) => b.timestamp - a.timestamp).slice(0,5)); 
    calculateAndSetDailyTotals(selectedDateMeals);
  }, [currentDate]);

  const openDeleteDialog = (id: string) => {
    setMealToDeleteId(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteMeal = () => {
    if (!mealToDeleteId) return;
    
    const storedMeals = getFromLocalStorage<Meal[]>('calSnapMeals', []);
    const updatedMeals = storedMeals.filter(m => m.id !== mealToDeleteId);
    setToLocalStorage('calSnapMeals', updatedMeals);

    const selectedDateMeals = updatedMeals.filter(meal => 
      format(new Date(meal.timestamp), 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd')
    );
    setRecentMeals(selectedDateMeals.sort((a,b) => b.timestamp - a.timestamp).slice(0,5));
    calculateAndSetDailyTotals(selectedDateMeals);
    
    toast({ title: "Meal Deleted", description: "The meal has been removed.", icon: <Trash2 className="h-5 w-5 text-destructive" /> });
    setMealToDeleteId(null);
    setSelectedMealForDeletion(null); 
    setIsDeleteDialogOpen(false);
  };

  const handleInteractionStart = (mealId: string) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
    longPressTimerRef.current = setTimeout(() => {
      setSelectedMealForDeletion(mealId);
    }, 700); // 700ms for long press
  };

  const handleInteractionEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectedMealForDeletion) {
        const target = event.target as HTMLElement;
        const clickedOnMealCard = target.closest(`[data-meal-card-id="${selectedMealForDeletion}"]`);
        const clickedOnTrashArea = target.closest('#delete-trash-area-dashboard');

        if (!clickedOnMealCard && !clickedOnTrashArea) {
          setSelectedMealForDeletion(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside as unknown as EventListener); // For touch devices
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside as unknown as EventListener);
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, [selectedMealForDeletion]);


  let calorieStatus: { value: number; label: string; isOver: boolean; textColor: string };

  if (userGoals.calories > 0) {
    if (dailyTotals.calories > userGoals.calories) {
      calorieStatus = {
        value: dailyTotals.calories - userGoals.calories,
        label: 'Cals Over',
        isOver: true,
        textColor: 'text-destructive',
      };
    } else {
      calorieStatus = {
        value: userGoals.calories - dailyTotals.calories,
        label: 'Cals Left',
        isOver: false,
        textColor: 'text-primary',
      };
    }
  } else {
    calorieStatus = {
      value: 0,
      label: 'Cals Left',
      isOver: false,
      textColor: 'text-primary',
    };
  }
  
  const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  
  const weekDates = Array(7).fill(null).map((_, i) => {
    const date = new Date(currentDate);
    const dayIndex = currentDate.getDay(); 
    date.setDate(currentDate.getDate() - dayIndex + i); 
    return date;
  });


  if (isLoadingGoals) {
    return (
      <AppWrapper className="bg-background text-foreground flex items-center justify-center">
        <p>Loading your data...</p>
      </AppWrapper>
    );
  }
  
  return (
    <AppWrapper className="bg-background text-foreground">
      <header className="bg-card px-6 py-4 flex justify-between items-center border-b sticky top-0 z-10">
        <h1 className="text-2xl font-bold font-headline text-primary">CalSnap</h1>
        <Link href="/profile">
          <Button variant="ghost" size="icon" aria-label="Profile">
            <User className="w-6 h-6 text-primary" />
          </Button>
        </Link>
      </header>
      
      <main className="p-6 flex-grow overflow-y-auto pb-24 relative">
        <div className="flex justify-between items-center mb-6">
          {weekDates.map((dateItem) => (
             <DayButton 
              key={dateItem.toISOString()} 
              day={daysOfWeek[dateItem.getDay()]} 
              date={dateItem.getDate()} 
              isActive={dateItem.toDateString() === currentDate.toDateString()}
              onClick={() => {setSelectedMealForDeletion(null); setCurrentDate(dateItem);}}
            />
          ))}
        </div>
        
        {userGoals.calories === 0 ? (
           <Card className="rounded-3xl p-6 mb-6 shadow-lg bg-secondary">
            <CardContent className="p-0 text-center">
              <h3 className="text-xl font-bold mb-2">Set Up Your Profile!</h3>
              <p className="text-muted-foreground mb-4">Complete the onboarding to get personalized calorie goals.</p>
              <Link href="/onboarding/gender">
                <Button>Start Onboarding</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
        <Card className="rounded-3xl p-6 mb-6 shadow-lg bg-card">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div className="relative">
                 <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" strokeWidth="8" fill="transparent" className="stroke-secondary" />
                  <circle
                    cx="50" cy="50" r="45" strokeWidth="8" fill="transparent"
                    className={cn("stroke-primary", calorieStatus.isOver && "stroke-destructive")}
                    strokeDasharray={2 * Math.PI * 45}
                    strokeDashoffset={(2 * Math.PI * 45) * (1 - (userGoals.calories > 0 ? Math.min(dailyTotals.calories, userGoals.calories) / userGoals.calories : 0) )}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <div className={cn("flex items-center", calorieStatus.textColor)}>
                    {calorieStatus.isOver && userGoals.calories > 0 && <AlertTriangle className="w-5 h-5 mr-1" />}
                    <span className="text-2xl font-bold">{calorieStatus.value}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{calorieStatus.label}</span>
                </div>
              </div>
              
              <div className="space-y-3">
                {[
                  { name: 'Protein', current: dailyTotals.protein, goal: userGoals.protein, colorClass: 'bg-chart-1' }, 
                  { name: 'Fat', current: dailyTotals.fat, goal: userGoals.fat, colorClass: 'bg-chart-4' },       
                  { name: 'Carbs', current: dailyTotals.carbohydrates, goal: userGoals.carbohydrates, colorClass: 'bg-chart-3' }, 
                ].map(macro => {
                  const isOverGoal = macro.current > macro.goal && macro.goal > 0;
                  return (
                    <div key={macro.name}>
                      <div className="text-sm font-semibold mb-0.5">{macro.name}</div>
                      <div className="text-xs text-muted-foreground flex items-center">
                        <span className={cn(isOverGoal && "text-destructive font-semibold")}>{Math.round(macro.current)}</span>
                        <span>/{macro.goal}g</span>
                        {isOverGoal && <AlertTriangle className="w-3 h-3 text-destructive ml-1" />}
                      </div>
                      <Progress 
                        value={macro.goal > 0 ? Math.min((macro.current / macro.goal) * 100, 100) : 0} 
                        className="w-24 h-1.5 rounded-full bg-secondary" 
                        indicatorClassName={cn(macro.colorClass, isOverGoal && "bg-destructive")}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
        )}
        
        <div className="mb-6">
          <h3 className="text-xl font-bold mb-4 font-headline">Recently Added</h3>
          {recentMeals.length === 0 ? (
            <Card className="bg-secondary rounded-3xl p-8 text-center">
              <CardContent className="p-0 flex flex-col items-center">
                <Camera className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h4 className="text-lg font-bold mb-2">No meals yet!</h4>
                <p className="text-muted-foreground text-sm">Tap the '+' to add your first meal for {format(currentDate, "MMMM do")}.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {recentMeals.map(meal => (
                <Card 
                  key={meal.id} 
                  data-meal-card-id={meal.id}
                  className={cn(
                    "rounded-2xl shadow-md hover:shadow-lg transition-all bg-card cursor-pointer",
                    selectedMealForDeletion === meal.id && "ring-2 ring-destructive shadow-xl scale-105"
                  )}
                  onMouseDown={() => handleInteractionStart(meal.id)}
                  onMouseUp={handleInteractionEnd}
                  onTouchStart={() => handleInteractionStart(meal.id)}
                  onTouchEnd={handleInteractionEnd}
                  onContextMenu={(e) => {
                    e.preventDefault(); 
                    handleInteractionStart(meal.id); 
                  }}
                >
                  <div className="p-3 flex items-stretch space-x-3">
                    <Link href={`/meal/${meal.id}`} className="flex-shrink-0" onClick={(e) => { if(selectedMealForDeletion) e.preventDefault();}}>
                        {meal.photoDataUri && (
                        <div className="w-20 h-20 relative rounded-lg overflow-hidden">
                            <Image src={meal.photoDataUri} alt={meal.name || "Logged meal"} layout="fill" className="object-cover" />
                        </div>
                        )}
                    </Link>
                    <div className="flex-grow flex flex-col justify-between py-0.5 min-w-0">
                        <Link href={`/meal/${meal.id}`} className="block" onClick={(e) => { if(selectedMealForDeletion) e.preventDefault();}}>
                        <div>
                            <div className="flex justify-between items-start mb-0.5">
                                <p className="font-semibold text-sm leading-tight text-foreground truncate flex-1 min-w-0 mr-2">{meal.name || "Unnamed Meal"}</p>
                                <p className="text-xs text-muted-foreground flex-shrink-0">{format(new Date(meal.timestamp), 'HH:mm')}</p>
                            </div>
                            <p className="text-lg font-bold text-primary">{meal.calories} Calories</p>
                        </div>
                        <div className="flex items-center space-x-3 mt-1">
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
                        </Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20">
        <Sheet open={isAddMealSheetOpen} onOpenChange={setIsAddMealSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="default" size="icon" className="bg-primary p-4 rounded-full shadow-lg h-14 w-14" aria-label="Add new meal">
              <Plus className="w-7 h-7 text-primary-foreground" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl h-auto p-0 bg-card">
            <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-muted-foreground/30" />
            <div className="p-5 space-y-1">
              <Link href="/add-meal" passHref onClick={() => setIsAddMealSheetOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-lg h-auto py-4 pl-3 text-card-foreground hover:bg-secondary">
                  <Camera className="mr-4 h-6 w-6 text-muted-foreground" /> Camera
                </Button>
              </Link>
              <Link href="/add-meal" passHref onClick={() => setIsAddMealSheetOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-lg h-auto py-4 pl-3 text-card-foreground hover:bg-secondary">
                  <LibraryBig className="mr-4 h-6 w-6 text-muted-foreground" /> Album
                </Button>
              </Link>
              <Link href="/add-meal" passHref onClick={() => setIsAddMealSheetOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-lg h-auto py-4 pl-3 text-card-foreground hover:bg-secondary">
                  <PenSquare className="mr-4 h-6 w-6 text-muted-foreground" /> Describe food
                </Button>
              </Link>
              <Link href="/add-meal" passHref onClick={() => setIsAddMealSheetOpen(false)}>
                 <Button variant="ghost" className="w-full justify-start text-lg h-auto py-4 pl-3 text-card-foreground hover:bg-secondary">
                  <Heart className="mr-4 h-6 w-6 text-muted-foreground" /> Favorites
                </Button>
              </Link>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {selectedMealForDeletion && (
        <div id="delete-trash-area-dashboard" className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-sm border-t border-border flex justify-center items-center z-30">
          <Button 
            variant="destructive" 
            size="lg" 
            className="w-auto px-8 py-4 rounded-xl"
            onClick={() => {
              if (selectedMealForDeletion) {
                openDeleteDialog(selectedMealForDeletion);
              }
            }}
          >
            <Trash2 className="mr-3 h-6 w-6" /> Delete Selected Meal
          </Button>
        </div>
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={(open) => {
          setIsDeleteDialogOpen(open);
          if (!open) {
            setMealToDeleteId(null); 
            setSelectedMealForDeletion(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this meal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setMealToDeleteId(null);
              setSelectedMealForDeletion(null);
            }}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteMeal} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppWrapper>
  );
}
