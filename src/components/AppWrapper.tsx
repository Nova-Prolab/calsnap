import type React from 'react';
import { cn } from '@/lib/utils';

interface AppWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export function AppWrapper({ children, className }: AppWrapperProps) {
  return (
    <div className={cn(
      "max-w-sm mx-auto shadow-2xl overflow-x-hidden min-h-screen flex flex-col animate-fade-in",
      className
    )}>
      {children}
    </div>
  );
}
