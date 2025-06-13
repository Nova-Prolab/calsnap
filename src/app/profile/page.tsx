'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, UserCircle2, Edit3 } from 'lucide-react';
import { AppWrapper } from '@/components/AppWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getFromLocalStorage } from '@/lib/localStorage';

export default function ProfileScreen() {
  const [selectedGender, setSelectedGender] = useState<string | null>(null);

  useEffect(() => {
    // This is a placeholder. In a real app, user data would come from a DB or auth provider.
    const gender = getFromLocalStorage<string | null>('selectedGender', null);
    setSelectedGender(gender);
  }, []);

  return (
    <AppWrapper className="bg-card text-card-foreground">
      <header className="p-6 flex items-center border-b">
        <Link href="/dashboard" className="text-muted-foreground hover:text-foreground mr-4">
          <ChevronLeft size={28} />
          <span className="sr-only">Back to Dashboard</span>
        </Link>
        <h1 className="text-2xl font-bold font-headline">User Profile</h1>
      </header>
      <main className="p-6 flex-grow">
        <Card className="shadow-lg">
          <CardHeader className="items-center text-center">
            <Avatar className="w-24 h-24 mb-4">
              <AvatarImage src="https://placehold.co/128x128.png?text=User" alt="User avatar" data-ai-hint="person avatar" />
              <AvatarFallback><UserCircle2 size={48} /></AvatarFallback>
            </Avatar>
            <CardTitle className="text-2xl font-headline">User Name</CardTitle>
            <p className="text-muted-foreground">user.name@example.com</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-secondary/50 rounded-lg">
              <span className="font-medium">Gender</span>
              <span className="text-muted-foreground">{selectedGender ? selectedGender.charAt(0).toUpperCase() + selectedGender.slice(1) : 'Not set'}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-secondary/50 rounded-lg">
              <span className="font-medium">Height</span>
              <span className="text-muted-foreground">5'10" (178 cm)</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-secondary/50 rounded-lg">
              <span className="font-medium">Weight</span>
              <span className="text-muted-foreground">165 lbs (75 kg)</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-secondary/50 rounded-lg">
              <span className="font-medium">Activity Level</span>
              <span className="text-muted-foreground">Moderate</span>
            </div>
            <Button variant="outline" className="w-full mt-6">
              <Edit3 className="mr-2 h-4 w-4" /> Edit Profile
            </Button>
          </CardContent>
        </Card>

        <Card className="mt-6 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-headline">Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="ghost" className="w-full justify-start">Notification Preferences</Button>
            <Button variant="ghost" className="w-full justify-start">Account Security</Button>
            <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10">Log Out</Button>
          </CardContent>
        </Card>
      </main>
    </AppWrapper>
  );
}
