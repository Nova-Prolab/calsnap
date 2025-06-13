
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

export default function HeightScreen() {
  const [height, setHeight] = useState<string>('');
  const router = useRouter();
  const { toast } = useToast();

  const handleContinue = () => {
    const heightNumber = parseFloat(height);
    if (isNaN(heightNumber) || heightNumber <= 50 || heightNumber > 250) {
      toast({
        variant: 'destructive',
        title: 'Invalid Height',
        description: 'Please enter a valid height in cm (e.g., 50-250).',
      });
      return;
    }
    setToLocalStorage<number>('onboardingHeight', heightNumber);
    router.push('/onboarding/weight');
  };

  return (
    <AppWrapper className="bg-card text-card-foreground">
      <div className="p-6 flex flex-col flex-grow">
        <OnboardingHeader backHref="/onboarding/age" progressValue={42} />
      
        <h1 className="text-3xl font-bold mb-4 font-headline">What's your height?</h1>
        <p className="text-muted-foreground mb-8">This is used to calculate your body metrics.</p>
      
        <div className="space-y-2">
          <Label htmlFor="height" className="text-sm font-medium">Height (cm)</Label>
          <Input 
            id="height"
            type="number"
            placeholder="e.g., 175"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            className="h-12 text-lg p-4 rounded-xl"
          />
        </div>
      
        <Button 
          onClick={handleContinue}
          variant="link"
          className="w-full mt-auto py-4 text-primary font-semibold text-lg"
          disabled={!height}
        >
          Continue
        </Button>
      </div>
    </AppWrapper>
  );
}
