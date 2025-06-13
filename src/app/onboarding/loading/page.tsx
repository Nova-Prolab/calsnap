
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppWrapper } from '@/components/AppWrapper';
import { CircularProgress } from '@/components/CircularProgress';
import { getFromLocalStorage, setToLocalStorage } from '@/lib/localStorage';
import { calculateCalorieGoals } from '@/lib/calorieCalculator';
import type { OnboardingData, CalorieGoals, Gender, ActivityLevel, Goal } from '@/types';

export default function LoadingScreen() {
  const [progress, setProgress] = useState(0);
  const router = useRouter();

  useEffect(() => {
    // Retrieve all onboarding data
    const gender = getFromLocalStorage<Gender | undefined>('onboardingGender', undefined);
    const age = getFromLocalStorage<number | undefined>('onboardingAge', undefined);
    const height = getFromLocalStorage<number | undefined>('onboardingHeight', undefined);
    const weight = getFromLocalStorage<number | undefined>('onboardingWeight', undefined);
    const activityLevel = getFromLocalStorage<ActivityLevel | undefined>('onboardingActivityLevel', undefined);
    const goal = getFromLocalStorage<Goal | undefined>('onboardingGoal', undefined);

    const onboardingData: OnboardingData = {
      gender, age, height, weight, activityLevel, goal
    };

    // Calculate and store goals
    const calculatedGoals = calculateCalorieGoals(onboardingData);
    setToLocalStorage<CalorieGoals>('userCalorieGoals', calculatedGoals);

    // Simulate loading process
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + 2; 
      });
    }, 50);
    
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (progress >= 100) {
      router.replace('/dashboard'); 
    }
  }, [progress, router]);

  return (
    <AppWrapper className="bg-card text-card-foreground">
      <div className="flex flex-col items-center justify-center flex-grow p-6">
        <CircularProgress progress={progress} size={128} strokeWidth={10} />
        <h2 className="text-2xl font-bold mt-8 mb-4 font-headline">We're creating your plan</h2>
        <p className="text-muted-foreground">Calculating your calorie goal...</p>
      </div>
    </AppWrapper>
  );
}
