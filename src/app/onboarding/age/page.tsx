
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

export default function AgeScreen() {
  const [age, setAge] = useState<string>('');
  const router = useRouter();
  const { toast } = useToast();

  const handleContinue = () => {
    const ageNumber = parseInt(age, 10);
    if (isNaN(ageNumber) || ageNumber <= 0 || ageNumber > 120) {
      toast({
        variant: 'destructive',
        title: 'Invalid Age',
        description: 'Please enter a valid age (e.g., 1-120).',
      });
      return;
    }
    setToLocalStorage<number>('onboardingAge', ageNumber);
    router.push('/onboarding/height');
  };

  return (
    <AppWrapper className="bg-card text-card-foreground">
      <div className="p-6 flex flex-col flex-grow">
        <OnboardingHeader backHref="/onboarding/gender" progressValue={28} />
      
        <h1 className="text-3xl font-bold mb-4 font-headline">What's your age?</h1>
        <p className="text-muted-foreground mb-8">This helps tailor your nutritional recommendations.</p>
      
        <div className="space-y-2">
          <Label htmlFor="age" className="text-sm font-medium">Age (years)</Label>
          <Input 
            id="age"
            type="number"
            placeholder="e.g., 30"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="h-12 text-lg p-4 rounded-xl"
          />
        </div>
      
        <Button 
          onClick={handleContinue}
          variant="link"
          className="w-full mt-auto py-4 text-primary font-semibold text-lg"
          disabled={!age}
        >
          Continue
        </Button>
      </div>
    </AppWrapper>
  );
}
