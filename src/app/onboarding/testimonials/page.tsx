'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Star } from 'lucide-react';
import { AppWrapper } from '@/components/AppWrapper';
import { Button } from '@/components/ui/button';
import { OnboardingHeader } from '@/components/OnboardingHeader';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';

const TestimonialItem = ({ stars, text }: { stars: number; text: string }) => (
  <Card className="bg-card p-4 rounded-2xl shadow-md">
    <CardContent className="p-0">
      <div className="flex mb-2">
        {Array(5).fill(0).map((_, i) => (
          <Star key={i} className={`w-4 h-4 ${i < stars ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
        ))}
      </div>
      <p className="text-sm text-foreground">{text}</p>
    </CardContent>
  </Card>
);

export default function TestimonialsScreen() {
  const router = useRouter();

  return (
    <AppWrapper className="bg-card text-card-foreground">
      <div className="p-6 flex flex-col flex-grow">
        <OnboardingHeader backHref="/onboarding/gender" progressValue={50} />
        
        <h1 className="text-3xl font-bold mb-6 text-center font-headline">Show your love</h1>
        
        <Card className="bg-card p-4 rounded-2xl mb-8 shadow-lg">
          <CardContent className="p-0">
            <div className="flex justify-center mb-4">
              {Array(5).fill(0).map((_, i) => (
                <Star key={i} className="text-yellow-400 fill-yellow-400 w-6 h-6 mx-1" />
              ))}
            </div>
            
            <div className="grid grid-cols-3 gap-3 mb-6 place-items-center">
              {Array(6).fill(0).map((_, i) => (
                <Image 
                  key={i} 
                  src={`https://placehold.co/64x64.png?text=U${i+1}`} 
                  alt={`User ${i+1}`}
                  width={48} 
                  height={48} 
                  className="rounded-full"
                  data-ai-hint="person avatar"
                />
              ))}
            </div>
          </CardContent>
        </Card>
        
        <h2 className="text-xl font-semibold text-center mb-6 font-headline">CalSnap users have already reached their goals.</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <TestimonialItem stars={5} text="CalSnap's been awesome for my weight loss! It tracks calories super fast and I didn't expect it to be this easy." />
          <TestimonialItem stars={4} text="Really helpful! CalSnap makes tracking super easy and I highly recommend it." />
        </div>
        
        <Button 
          onClick={() => router.push('/onboarding/loading')}
          variant="default"
          size="lg"
          className="w-full mt-auto bg-primary text-primary-foreground hover:bg-primary/90 py-4 rounded-2xl font-semibold text-lg"
        >
          Continue
        </Button>
      </div>
    </AppWrapper>
  );
}
