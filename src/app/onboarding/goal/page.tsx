
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppWrapper } from '@/components/AppWrapper';
import { Button } from '@/components/ui/button';
import { OnboardingHeader } from '@/components/OnboardingHeader';
import { cn } from '@/lib/utils';
import { setToLocalStorage } from '@/lib/localStorage';
import type { Goal } from '@/types';

const goals: {id: Goal, label: string, description: string}[] = [
  { id: 'lose_weight', label: 'Lose Weight', description: 'Create a calorie deficit to shed pounds.' },
  { id: 'maintain_weight', label: 'Maintain Weight', description: 'Keep your current weight stable.' },
  { id: 'gain_weight', label: 'Gain Weight', description: 'Create a calorie surplus to build mass.' },
];

export default function GoalScreen() {
  const [selectedGoal, setSelectedGoal] = useState<Goal | ''>('');
  const router = useRouter();

  const handleContinue = () => {
    if (selectedGoal) {
      setToLocalStorage<Goal>('onboardingGoal', selectedGoal);
      router.push('/onboarding/testimonials');
    }
  };

  return (
    <AppWrapper className="bg-card text-card-foreground">
      <div className="p-6 flex flex-col flex-grow">
        <OnboardingHeader backHref="/onboarding/activity-level" progressValue={84} />
      
        <h1 className="text-3xl font-bold mb-4 font-headline">What's your goal?</h1>
        <p className="text-muted-foreground mb-8">This will determine your target calorie intake.</p>
      
        <div className="space-y-3">
          {goals.map(goal => (
            <Button 
              key={goal.id}
              onClick={() => setSelectedGoal(goal.id)}
              variant="outline"
              className={cn(
                "w-full p-4 h-auto rounded-xl text-left justify-start items-center",
                selectedGoal === goal.id ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-card hover:bg-secondary'
              )}
            >
              <div>
                <p className="font-semibold text-md">{goal.label}</p>
                <p className={cn("text-xs", selectedGoal === goal.id ? "text-primary-foreground/80" : "text-muted-foreground")}>{goal.description}</p>
              </div>
            </Button>
          ))}
        </div>
      
        {selectedGoal && (
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
