
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, UserCircle2, Edit3, Cake, Ruler, Weight, Zap, Target } from 'lucide-react';
import { AppWrapper } from '@/components/AppWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getFromLocalStorage } from '@/lib/localStorage';
import type { OnboardingData, Gender, ActivityLevel, Goal } from '@/types';

const ProfileInfoRow = ({ icon: Icon, label, value }: {icon: React.ElementType, label: string, value: string | number | undefined}) => (
  <div className="flex justify-between items-center p-3 bg-secondary/50 rounded-lg">
    <div className="flex items-center">
      <Icon className="mr-3 h-5 w-5 text-primary" />
      <span className="font-medium">{label}</span>
    </div>
    <span className="text-muted-foreground">{value || 'Not set'}</span>
  </div>
);

const formatActivityLevel = (level?: ActivityLevel): string => {
  if (!level) return 'Not set';
  return level.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

const formatGoal = (goal?: Goal): string => {
  if (!goal) return 'Not set';
  return goal.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

export default function ProfileScreen() {
  const [userData, setUserData] = useState<OnboardingData | null>(null);

  useEffect(() => {
    const gender = getFromLocalStorage<Gender | undefined>('onboardingGender', undefined);
    const age = getFromLocalStorage<number | undefined>('onboardingAge', undefined);
    const height = getFromLocalStorage<number | undefined>('onboardingHeight', undefined);
    const weight = getFromLocalStorage<number | undefined>('onboardingWeight', undefined);
    const activityLevel = getFromLocalStorage<ActivityLevel | undefined>('onboardingActivityLevel', undefined);
    const goal = getFromLocalStorage<Goal | undefined>('onboardingGoal', undefined);
    
    setUserData({ gender, age, height, weight, activityLevel, goal });
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
        <Card className="shadow-lg mb-6">
          <CardHeader className="items-center text-center">
            <Avatar className="w-24 h-24 mb-4">
              <AvatarImage src="https://placehold.co/128x128.png?text=User" alt="User avatar" data-ai-hint="person avatar" />
              <AvatarFallback><UserCircle2 size={48} /></AvatarFallback>
            </Avatar>
            <CardTitle className="text-2xl font-headline">User Name</CardTitle>
            <p className="text-muted-foreground">user.name@example.com</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <ProfileInfoRow icon={UserCircle2} label="Gender" value={userData?.gender ? userData.gender.charAt(0).toUpperCase() + userData.gender.slice(1) : 'Not set'} />
            <ProfileInfoRow icon={Cake} label="Age" value={userData?.age ? `${userData.age} years` : 'Not set'} />
            <ProfileInfoRow icon={Ruler} label="Height" value={userData?.height ? `${userData.height} cm` : 'Not set'} />
            <ProfileInfoRow icon={Weight} label="Weight" value={userData?.weight ? `${userData.weight} kg` : 'Not set'} />
            <ProfileInfoRow icon={Zap} label="Activity Level" value={formatActivityLevel(userData?.activityLevel)} />
            <ProfileInfoRow icon={Target} label="Goal" value={formatGoal(userData?.goal)} />
            
            <Button variant="outline" className="w-full mt-6">
              <Edit3 className="mr-2 h-4 w-4" /> Edit Profile
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
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
