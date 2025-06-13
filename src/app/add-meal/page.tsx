'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { AppWrapper } from '@/components/AppWrapper';
import { CalorieEstimationForm } from '@/components/CalorieEstimationForm';

export default function AddMealScreen() {
  return (
    <AppWrapper className="bg-card text-card-foreground">
      <header className="p-6 flex items-center border-b">
        <Link href="/dashboard" className="text-muted-foreground hover:text-foreground mr-4">
          <ChevronLeft size={28} />
          <span className="sr-only">Back to Dashboard</span>
        </Link>
        <h1 className="text-2xl font-bold font-headline">Add New Meal</h1>
      </header>
      <main className="p-6 flex-grow">
        <CalorieEstimationForm />
      </main>
    </AppWrapper>
  );
}
