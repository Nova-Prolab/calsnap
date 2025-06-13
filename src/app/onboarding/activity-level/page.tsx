
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppWrapper } from '@/components/AppWrapper';
import { Button } from '@/components/ui/button';
import { OnboardingHeader } from '@/components/OnboardingHeader';
import { cn } from '@/lib/utils';
import { setToLocalStorage } from '@/lib/localStorage';
import type { ActivityLevel } from '@/types';

const activityLevels: {id: ActivityLevel, label: string, description: string}[] = [
  { id: 'sedentary', label: 'Sedentary', description: 'Little or no exercise' },
  { id: 'lightly_active', label: 'Lightly Active', description: 'Light exercise/sports 1-3 days/week' },
  { id: 'moderately_active', label: 'Moderately Active', description: 'Moderate exercise/sports 3-5 days/week' },
  { id: 'very_active', label: 'Very Active', description: 'Hard exercise/sports 6-7 days a week' },
  { id: 'extra_active', label: 'Extra Active', description: 'Very hard exercise/sports & physical job' },
];

export default function ActivityLevelScreen() {
  const [selectedLevel, setSelectedLevel] = useState<ActivityLevel | ''>('');
  const router = useRouter();

  const handleContinue = () => {
    if (selectedLevel) {
      setToLocalStorage<ActivityLevel>('onboardingActivityLevel', selectedLevel);
      router.push('/onboarding/goal');
    }
  };

  return (
    <AppWrapper className="bg-card text-card-foreground">
      <div className="p-6 flex flex-col flex-grow">
        <OnboardingHeader backHref="/onboarding/weight" progressValue={70} />
      
        <h1 className="text-3xl font-bold mb-4 font-headline">Your activity level?</h1>
        <p className="text-muted-foreground mb-8">This helps us estimate your daily calorie needs.</p>
      
        <div className="space-y-3">
          {activityLevels.map(level => (
            <Button 
              key={level.id}
              onClick={() => setSelectedLevel(level.id)}
              variant="outline"
              className={cn(
                "w-full p-4 h-auto rounded-xl text-left justify-start items-center",
                selectedLevel === level.id ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-card hover:bg-secondary'
              )}
            >
              <div>
                <p className="font-semibold text-md">{level.label}</p>
                <p className={cn("text-xs", selectedLevel === level.id ? "text-primary-foreground/80" : "text-muted-foreground")}>{level.description}</p>
              </div>
            </Button>
          ))}
        </div>
      
        {selectedLevel && (
          <Button 
            onClick={handleContinue}
            variant="link"
            className="w-full mt-auto py-4 text-primary font-semibold text-lg"
          >
            Continue
          </Button>
        )}
      </div>
    </AppWrapper>
  );
}
