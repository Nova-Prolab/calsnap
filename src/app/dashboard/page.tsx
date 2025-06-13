'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { User, Camera, Crown, Plus, Settings } from 'lucide-react';
import { AppWrapper } from '@/components/AppWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { Meal, DailyTotals, CalorieGoals } from '@/types';
import { getFromLocalStorage } from '@/lib/localStorage';
import { format } from 'date-fns';

// Mock goals
const MOCK_GOALS: CalorieGoals = {
  calories: 2740,
  protein: 171,
  fat: 91,
  carbohydrates: 308,
};

const DayButton = ({ day, date, isActive }: { day: string; date: number; isActive: boolean }) => (
  <div className="text-center">
    <div className="text-sm text-muted-foreground mb-1">{day}</div>
    <Button
      variant={isActive ? 'default': 'ghost'}
      size="icon"
      className={`w-8 h-8 rounded-full text-sm ${isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}
    >
      {date}
    </Button>
  </div>
);

export default function DashboardScreen() {
  const [recentMeals, setRecentMeals] = useState<Meal[]>([]);
  const [dailyTotals, setDailyTotals] = useState<DailyTotals>({ calories: 0, protein: 0, fat: 0, carbohydrates: 0 });
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const storedMeals = getFromLocalStorage<Meal[]>('calSnapMeals', []);
    // For simplicity, filter meals for the current day. A real app would handle dates better.
    const todayMeals = storedMeals.filter(meal => 
      format(new Date(meal.timestamp), 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd')
    );
    setRecentMeals(todayMeals.slice(0, 3)); // Show latest 3

    const totals = todayMeals.reduce((acc, meal) => {
      acc.calories += meal.calories;
      acc.protein += meal.protein;
      acc.fat += meal.fat;
      acc.carbohydrates += meal.carbohydrates;
      return acc;
    }, { calories: 0, protein: 0, fat: 0, carbohydrates: 0 });
    setDailyTotals(totals);
  }, [currentDate]);

  const caloriesLeft = Math.max(0, MOCK_GOALS.calories - dailyTotals.calories);
  const calorieProgress = MOCK_GOALS.calories > 0 ? (dailyTotals.calories / MOCK_GOALS.calories) * 100 : 0;

  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const todayDayIndex = currentDate.getDay(); // Sunday - 0, Monday - 1 ..
  
  // Create a week view centered around today
  const weekDates = Array(7).fill(null).map((_, i) => {
    const date = new Date(currentDate);
    date.setDate(currentDate.getDate() - (todayDayIndex - i + 7) % 7 + 3 ); // Adjust to center week view based on current day
    return date;
  });


  return (
    <AppWrapper className="bg-card text-card-foreground">
      <header className="bg-card px-6 py-4 flex justify-between items-center border-b sticky top-0 z-10">
        <h1 className="text-2xl font-bold font-headline text-primary">CalSnap</h1>
        <Link href="/profile" legacyBehavior passHref>
          <Button variant="ghost" size="icon" aria-label="Profile">
            <User className="w-6 h-6 text-primary" />
          </Button>
        </Link>
      </header>
      
      <main className="p-6 flex-grow overflow-y-auto pb-24"> {/* Padding bottom for FABs */}
        <div className="flex justify-between items-center mb-6">
          {weekDates.map((dateItem, index) => (
             <DayButton 
              key={index} 
              day={days[dateItem.getDay()]} 
              date={dateItem.getDate()} 
              isActive={dateItem.toDateString() === currentDate.toDateString()} 
            />
          ))}
        </div>
        
        <Card className="rounded-3xl p-6 mb-6 shadow-lg">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div className="relative">
                 <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" strokeWidth="8" fill="transparent" className="stroke-secondary" />
                  <circle
                    cx="50" cy="50" r="45" strokeWidth="8" fill="transparent"
                    className="stroke-primary"
                    strokeDasharray={2 * Math.PI * 45}
                    strokeDashoffset={(2 * Math.PI * 45) * (1 - Math.min(dailyTotals.calories, MOCK_GOALS.calories) / MOCK_GOALS.calories )}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-bold text-primary">{caloriesLeft}</span>
                  <span className="text-xs text-muted-foreground">Cals Left</span>
                </div>
              </div>
              
              <div className="space-y-3">
                {[
                  { name: 'Protein', current: dailyTotals.protein, goal: MOCK_GOALS.protein, color: 'bg-orange-400' },
                  { name: 'Fat', current: dailyTotals.fat, goal: MOCK_GOALS.fat, color: 'bg-yellow-400' },
                  { name: 'Carbs', current: dailyTotals.carbohydrates, goal: MOCK_GOALS.carbohydrates, color: 'bg-blue-400' },
                ].map(macro => (
                  <div key={macro.name}>
                    <div className="text-sm font-semibold mb-0.5">{macro.name}</div>
                    <div className="text-xs text-muted-foreground">{Math.round(macro.current)}/{macro.goal}g</div>
                    <Progress value={macro.goal > 0 ? (macro.current / macro.goal) * 100 : 0} className={`w-24 h-1.5 rounded-full ${macro.color}`} indicatorClassName="bg-transparent" />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="mb-6">
          <h3 className="text-xl font-bold mb-4 font-headline">Recently Added</h3>
          {recentMeals.length === 0 ? (
            <Card className="bg-secondary rounded-3xl p-8 text-center">
              <CardContent className="p-0 flex flex-col items-center">
                <Camera className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h4 className="text-lg font-bold mb-2">No meals yet!</h4>
                <p className="text-muted-foreground text-sm">Tap the '+' to add your first meal.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {recentMeals.map(meal => (
                <Card key={meal.id} className="rounded-2xl shadow-md">
                  <CardContent className="p-4 flex items-center space-x-4">
                    {meal.photoDataUri && (
                      <Image src={meal.photoDataUri} alt={meal.name || "Logged meal"} width={64} height={64} className="rounded-lg object-cover" />
                    )}
                    <div className="flex-grow">
                      <p className="font-semibold">{meal.name || `${meal.calories} kcal meal`}</p>
                      <p className="text-sm text-muted-foreground">
                        {meal.calories} kcal &bull; P:{meal.protein}g F:{meal.fat}g C:{meal.carbohydrates}g
                      </p>
                    </div>
                     <Button variant="ghost" size="icon" className="text-muted-foreground">
                        <Settings size={16}/>
                     </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      
      <div className="fixed bottom-6 right-6 flex space-x-3 z-20">
        <Button variant="default" size="icon" className="bg-gradient-to-r from-orange-500 to-yellow-400 p-4 rounded-full shadow-lg h-14 w-14" aria-label="Premium features">
          <Crown className="w-6 h-6 text-white" />
        </Button>
        <Link href="/add-meal" legacyBehavior passHref>
          <Button variant="default" size="icon" className="bg-primary p-4 rounded-full shadow-lg h-14 w-14" aria-label="Add new meal">
            <Plus className="w-7 h-7 text-primary-foreground" />
          </Button>
        </Link>
      </div>
    </AppWrapper>
  );
}
