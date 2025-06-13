
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppWrapper } from '@/components/AppWrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { OnboardingHeader } from '@/components/OnboardingHeader';
import { setToLocalStorage } from '@/lib/localStorage';
import { useToast } from '@/hooks/use-toast';

export default function WeightScreen() {
  const [weight, setWeight] = useState<string>('');
  const router = useRouter();
  const { toast } = useToast();

  const handleContinue = () => {
    const weightNumber = parseFloat(weight);
    if (isNaN(weightNumber) || weightNumber <= 20 || weightNumber > 300) {
       toast({
        variant: 'destructive',
        title: 'Invalid Weight',
        description: 'Please enter a valid weight in kg (e.g., 20-300).',
      });
      return;
    }
    setToLocalStorage<number>('onboardingWeight', weightNumber);
    router.push('/onboarding/activity-level');
  };

  return (
    <AppWrapper className="bg-card text-card-foreground">
      <div className="p-6 flex flex-col flex-grow">
        <OnboardingHeader backHref="/onboarding/height" progressValue={56} />
      
        <h1 className="text-3xl font-bold mb-4 font-headline">What's your weight?</h1>
        <p className="text-muted-foreground mb-8">This helps us personalize your calorie goals.</p>
      
        <div className="space-y-2">
          <Label htmlFor="weight" className="text-sm font-medium">Weight (kg)</Label>
          <Input 
            id="weight"
            type="number"
            placeholder="e.g., 70"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="h-12 text-lg p-4 rounded-xl"
          />
        </div>
      
        <Button 
          onClick={handleContinue}
          variant="link"
          className="w-full mt-auto py-4 text-primary font-semibold text-lg"
          disabled={!weight}
        >
          Continue
        </Button>
      </div>
    </AppWrapper>
  );
}
