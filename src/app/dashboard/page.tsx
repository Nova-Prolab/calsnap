
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { User, Camera, Plus, AlertTriangle } from 'lucide-react';
import { AppWrapper } from '@/components/AppWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { Meal, DailyTotals, CalorieGoals } from '@/types';
import { getFromLocalStorage } from '@/lib/localStorage';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

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

    const totals = selectedDateMeals.reduce((acc, meal) => {
      acc.calories += meal.calories;
      acc.protein += meal.protein;
      acc.fat += meal.fat;
      acc.carbohydrates += meal.carbohydrates;
      return acc;
    }, { calories: 0, protein: 0, fat: 0, carbohydrates: 0 });
    setDailyTotals(totals);
  }, [currentDate]);

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
      <AppWrapper className="bg-card text-card-foreground flex items-center justify-center">
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
      
      <main className="p-6 flex-grow overflow-y-auto pb-24">
        <div className="flex justify-between items-center mb-6">
          {weekDates.map((dateItem) => (
             <DayButton 
              key={dateItem.toISOString()} 
              day={daysOfWeek[dateItem.getDay()]} 
              date={dateItem.getDate()} 
              isActive={dateItem.toDateString() === currentDate.toDateString()}
              onClick={() => setCurrentDate(dateItem)}
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
                <Link href={`/meal/${meal.id}`} key={meal.id} className="block">
                  <Card className="rounded-2xl shadow-md hover:shadow-lg transition-shadow cursor-pointer bg-card">
                    <CardContent className="p-3 flex items-stretch space-x-3">
                      {meal.photoDataUri && (
                        <div className="w-20 h-20 relative rounded-lg overflow-hidden flex-shrink-0">
                          <Image src={meal.photoDataUri} alt={meal.name || "Logged meal"} layout="fill" className="object-cover" />
                        </div>
                      )}
                      <div className="flex-grow flex flex-col justify-between py-0.5">
                        <div>
                          <div className="flex justify-between items-start mb-0.5">
                            <p className="font-semibold text-sm leading-tight text-foreground truncate pr-2" style={{maxWidth: 'calc(100% - 40px)'}}>{meal.name || "Unnamed Meal"}</p>
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
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      
      <div className="fixed bottom-6 right-6 flex space-x-3 z-20">
        <Link href="/add-meal">
          <Button variant="default" size="icon" className="bg-primary p-4 rounded-full shadow-lg h-14 w-14" aria-label="Add new meal">
            <Plus className="w-7 h-7 text-primary-foreground" />
          </Button>
        </Link>
      </div>
    </AppWrapper>
  );
}

