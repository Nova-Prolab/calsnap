
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { AppWrapper } from '@/components/AppWrapper';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function HomePage() {
  return (
    <AppWrapper className="bg-slate-900 text-primary-foreground">
      <div className="relative">
        <Image
          src="https://placehold.co/400x384.png"
          alt="Healthy salad bowl"
          width={400}
          height={384}
          className="w-full h-96 object-cover"
          data-ai-hint="salad food"
          priority
        />
        
        <Badge variant="secondary" className="absolute top-4 left-4 bg-orange-100 text-orange-800 px-3 py-2 text-sm font-semibold">
          <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>P 25g
        </Badge>
        
        <Badge variant="secondary" className="absolute top-20 right-4 bg-blue-100 text-blue-800 px-3 py-2 text-sm font-semibold">
          <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>C 30g
        </Badge>
        
        <Badge variant="secondary" className="absolute bottom-32 left-4 bg-yellow-100 text-yellow-800 px-3 py-2 text-sm font-semibold">
          <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>F 15g
        </Badge>
        
        <Badge variant="secondary" className="absolute bottom-20 right-4 bg-pink-100 text-pink-800 px-3 py-2 text-sm font-semibold">
          <span className="w-2 h-2 bg-pink-500 rounded-full mr-2"></span>8/10
        </Badge>
      </div>
      
      <div className="p-6">
        <h1 className="text-4xl font-bold mb-2 font-headline">Easy AI Calorie Tracking</h1>
        <p className="text-slate-300 text-lg mb-4">Just snap a quick photo of your meal and AI will do the rest</p>
        <p className="text-slate-400 mb-8">Get your personal plan in less than 1 min</p>
        
        <Link href="/onboarding/gender">
          <Button 
            variant="default"
            size="lg"
            className="w-full bg-primary-foreground text-slate-900 hover:bg-slate-200 py-4 rounded-2xl font-semibold text-lg"
          >
            Get Started →
          </Button>
        </Link>
      </div>
    </AppWrapper>
  );
}
