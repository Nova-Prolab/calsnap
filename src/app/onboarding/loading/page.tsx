'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppWrapper } from '@/components/AppWrapper';
import { CircularProgress } from '@/components/CircularProgress';

export default function LoadingScreen() {
  const [progress, setProgress] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          router.replace('/dashboard'); // Use replace to prevent going back to loading
          return 100;
        }
        return prev + 2; // Faster progress for demo
      });
    }, 50); // Faster interval
    
    return () => clearInterval(timer);
  }, [router]);

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
