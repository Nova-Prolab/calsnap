
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppWrapper } from '@/components/AppWrapper';
import { Button } from '@/components/ui/button';
import { OnboardingHeader } from '@/components/OnboardingHeader';
import { cn } from '@/lib/utils';
import { setToLocalStorage } from '@/lib/localStorage';
import type { Gender } from '@/types';

export default function GenderScreen() {
  const [selectedGender, setSelectedGender] = useState<Gender | ''>('');
  const router = useRouter();

  const handleContinue = () => {
    if (selectedGender) {
      setToLocalStorage<Gender>('onboardingGender', selectedGender);
      router.push('/onboarding/age');
    }
  };

  return (
    <AppWrapper className="bg-card text-card-foreground">
      <div className="p-6 flex flex-col flex-grow">
        <OnboardingHeader backHref="/" progressValue={14} />
      
        <h1 className="text-3xl font-bold mb-4 font-headline">Choose your gender</h1>
        <p className="text-muted-foreground mb-12">This helps us create a more personalized plan for you.</p>
      
        <div className="space-y-4">
          <Button 
            onClick={() => setSelectedGender('male')}
            variant="outline"
            className={cn(
              "w-full p-6 h-auto rounded-2xl text-left font-semibold text-lg justify-start",
              selectedGender === 'male' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-card hover:bg-secondary'
            )}
          >
            Male
          </Button>
          
          <Button 
            onClick={() => setSelectedGender('female')}
            variant="outline"
            className={cn(
              "w-full p-6 h-auto rounded-2xl text-left font-semibold text-lg justify-start",
              selectedGender === 'female' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-card hover:bg-secondary'
            )}
          >
            Female
          </Button>
        </div>
      
        {selectedGender && (
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
