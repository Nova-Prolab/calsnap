'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface OnboardingHeaderProps {
  backHref: string;
  progressValue: number; // e.g., 25 for 25%
}

export function OnboardingHeader({ backHref, progressValue }: OnboardingHeaderProps) {
  return (
    <div className="mb-8">
      <Link href={backHref} className="text-muted-foreground hover:text-foreground">
        <ChevronLeft size={32} />
        <span className="sr-only">Back</span>
      </Link>
      <Progress value={progressValue} className="w-full h-1.5 rounded-full mt-4 bg-secondary" indicatorClassName="bg-primary" />
    </div>
  );
}
