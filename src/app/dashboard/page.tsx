
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation'; // Added import
import { User, Camera, Plus, AlertTriangle, Trash2, LibraryBig, PenSquare, Heart, Loader2, X as CancelIcon, Check } from 'lucide-react';
import { AppWrapper } from '@/components/AppWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { Meal, DailyTotals, CalorieGoals } from '@/types';
import { getFromLocalStorage, setToLocalStorage } from '@/lib/localStorage';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle as AlertDialogTitleComponent,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { estimateMealCalories, type EstimateMealCaloriesOutput } from '@/ai/flows/estimate-meal-calories';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader as DialogHeaderComponent, DialogTitle as DialogTitleComponent, DialogFooter } from '@/components/ui/dialog';


const DayButton = ({ day, date, isActive, onClick }: { day: string; date: number; isActive: boolean; onClick: () => void }) => (
  <div className="text-center">
    <div className="text-sm text-muted-foreground mb-1">{day}</div>
    <Button
      onClick={onClick}
      variant={isActive ? 'default': 'ghost'}
      size="icon"
      className={`w-8 h-8 rounded-full text-sm ${isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}
    >
      {date}
    </Button>
  </div>
);

const MacroIcon = ({ letter, bgColorClass }: { letter: string; bgColorClass: string }) => (
  <div className={`w-5 h-5 rounded-full ${bgColorClass} flex items-center justify-center text-xs font-semibold text-primary-foreground mr-1.5`}>
    {letter}
  </div>
);

export default function DashboardScreen() {
  const [recentMeals, setRecentMeals] = useState<Meal[]>([]);
  const [dailyTotals, setDailyTotals] = useState<DailyTotals>({ calories: 0, protein: 0, fat: 0, carbohydrates: 0 });
  const [userGoals, setUserGoals] = useState<CalorieGoals>({ calories: 0, protein: 0, fat: 0, carbohydrates: 0 });
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLoadingGoals, setIsLoadingGoals] = useState(true);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const [selectedMealsForDeletion, setSelectedMealsForDeletion] = useState<string[]>([]);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef<boolean>(false);

  const [isAddMealSheetOpen, setIsAddMealSheetOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const calculateAndSetDailyTotals = (mealsForDate: Meal[]) => {
    const totals = mealsForDate.reduce((acc, meal) => {
      if (!meal.isAnalyzingPlaceholder) {
        acc.calories += meal.calories;
        acc.protein += meal.protein;
        acc.fat += meal.fat;
        acc.carbohydrates += meal.carbohydrates;
      }
      return acc;
    }, { calories: 0, protein: 0, fat: 0, carbohydrates: 0 });
    setDailyTotals(totals);
  };

  useEffect(() => {
    const storedGoals = getFromLocalStorage<CalorieGoals | null>('userCalorieGoals', null);
    if (storedGoals && storedGoals.calories > 0) {
      setUserGoals(storedGoals);
    } else {
      setUserGoals({ calories: 0, protein: 0, fat: 0, carbohydrates: 0 });
    }
    setIsLoadingGoals(false);

    const storedMeals = getFromLocalStorage<Meal[]>('calSnapMeals', []);
    const selectedDateMeals = storedMeals.filter(meal =>
      format(new Date(meal.timestamp), 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd') && !meal.isAnalyzingPlaceholder
    );
    const analyzingPlaceholders = recentMeals.filter(meal => meal.isAnalyzingPlaceholder);
    
    setRecentMeals([...analyzingPlaceholders, ...selectedDateMeals.sort((a,b) => b.timestamp - a.timestamp).slice(0,5-analyzingPlaceholders.length)]);
    calculateAndSetDailyTotals(selectedDateMeals);
  }, [currentDate]); // Removed recentMeals from dependency array to avoid potential loops

  useEffect(() => {
    // Recalculate totals if recentMeals (excluding placeholders) change for the current date.
    // This handles updates after meal deletion or analysis completion.
    const currentDayMeals = recentMeals.filter(m => !m.isAnalyzingPlaceholder && format(new Date(m.timestamp), 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd'));
    calculateAndSetDailyTotals(currentDayMeals);
  }, [recentMeals, currentDate]);


  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, [cameraStream]);

  const requestCameraPermission = async () => {
    if (cameraStream) {
       cameraStream.getTracks().forEach(track => track.stop());
       setCameraStream(null);
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraStream(stream);
      setHasCameraPermission(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasCameraPermission(false);
      toast({
        variant: 'destructive',
        title: 'Camera Access Denied',
        description: 'Please enable camera permissions in your browser settings.',
      });
      setIsCameraModalOpen(false);
    }
  };

  const openCameraModal = () => {
    setIsAddMealSheetOpen(false);
    setIsCameraModalOpen(true);
    requestCameraPermission();
  };

  const handleCapturePhoto = () => {
    if (videoRef.current && canvasRef.current && cameraStream) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const photoDataUri = canvas.toDataURL('image/jpeg');
        processPhotoForAnalysis(photoDataUri);
      }
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
      setIsCameraModalOpen(false);
    }
  };

  const openDeleteDialog = () => {
    if (selectedMealsForDeletion.length > 0) {
      setIsDeleteDialogOpen(true);
    }
  };

  const confirmDeleteMeal = () => {
    if (selectedMealsForDeletion.length === 0) return;

    const storedMeals = getFromLocalStorage<Meal[]>('calSnapMeals', []);
    const updatedMeals = storedMeals.filter(m => !selectedMealsForDeletion.includes(m.id));
    setToLocalStorage('calSnapMeals', updatedMeals);

    const currentRecentMeals = recentMeals.filter(m => !selectedMealsForDeletion.includes(m.id));
    setRecentMeals(currentRecentMeals);
    // Daily totals will be recalculated by the useEffect watching recentMeals

    toast({ title: `${selectedMealsForDeletion.length} Meal(s) Deleted`, description: "The selected meal(s) have been removed.", icon: <Trash2 className="h-5 w-5 text-destructive" /> });
    setSelectedMealsForDeletion([]);
    setIsDeleteDialogOpen(false);
  };
  
  const handleInteractionStart = (mealId: string) => {
    isLongPressRef.current = false;
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      setSelectedMealsForDeletion(prevSelected => 
        prevSelected.includes(mealId) ? prevSelected : [...prevSelected, mealId]
      );
    }, 400); // Reduced long press time
  };

  const router = useRouter();
  const handleInteractionEnd = (mealId: string, event?: React.MouseEvent | React.TouchEvent) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
    if (!isLongPressRef.current) { // It was a tap
      if (selectedMealsForDeletion.length > 0) { // In selection mode
         event?.preventDefault(); // Prevent navigation if in selection mode
        setSelectedMealsForDeletion(prevSelected =>
          prevSelected.includes(mealId)
            ? prevSelected.filter(id => id !== mealId)
            : [...prevSelected, mealId]
        );
      } else {
        // Only navigate if not in selection mode and it was not a long press
        // router.push(`/meal/${mealId}`); // Navigation handled by Link component by default
      }
    }
  };
  

  const processPhotoForAnalysis = async (photoDataUri: string) => {
    const analysisId = `analysis-${crypto.randomUUID()}`;

    const placeholderMeal: Meal = {
      id: analysisId,
      name: 'Analyzing...',
      photoDataUri,
      calories: 0, protein: 0, fat: 0, carbohydrates: 0,
      timestamp: Date.now(),
      isAnalyzingPlaceholder: true,
    };

    setRecentMeals(prevMeals => [placeholderMeal, ...prevMeals.filter(m => !m.isAnalyzingPlaceholder && m.id !== analysisId)]);


    try {
      const estimationResult = await estimateMealCalories({ photoDataUri });
      const newMeal: Meal = {
        id: crypto.randomUUID(),
        name: estimationResult.suggestedName || `Meal at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        photoDataUri,
        calories: parseFloat(estimationResult.calorieEstimate.toFixed(0)),
        protein: parseFloat(estimationResult.macronutrientBreakdown.protein.toFixed(1)),
        fat: parseFloat(estimationResult.macronutrientBreakdown.fat.toFixed(1)),
        carbohydrates: parseFloat(estimationResult.macronutrientBreakdown.carbohydrates.toFixed(1)),
        timestamp: placeholderMeal.timestamp,
        ingredients: estimationResult.ingredients || [],
        healthScore: estimationResult.healthScore,
        isFavorite: false,
        calorieExplanation: estimationResult.calorieExplanation,
        proteinExplanation: estimationResult.proteinExplanation,
        fatExplanation: estimationResult.fatExplanation,
        carbohydratesExplanation: estimationResult.carbohydratesExplanation,
        healthScoreExplanation: estimationResult.healthScoreExplanation,
      };

      const storedMeals = getFromLocalStorage<Meal[]>('calSnapMeals', []);
      setToLocalStorage('calSnapMeals', [...storedMeals, newMeal]);

      setRecentMeals(prevMeals => {
          const updated = prevMeals.map(m => m.id === analysisId ? newMeal : m);
          // Filter for current date after update
          const currentDayMeals = updated.filter(m => 
              (!m.isAnalyzingPlaceholder && format(new Date(m.timestamp), 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd')) || 
              (m.isAnalyzingPlaceholder && format(new Date(m.timestamp), 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd'))
          );
          return currentDayMeals.sort((a,b) => b.timestamp - a.timestamp).slice(0,5);
      });


    } catch (error) {
      console.error("Error estimating calories from dashboard:", error);
      toast({ title: "Estimation Failed", description: "Could not estimate calories. Please try again.", variant: "destructive" });
      setRecentMeals(prevMeals => prevMeals.filter(m => m.id !== analysisId));
    } finally {
       if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleFileSelectedForAnalysis = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsAddMealSheetOpen(false);
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const photoDataUri = reader.result as string;
        processPhotoForAnalysis(photoDataUri);
      };
      reader.readAsDataURL(file);
    }
  };


  const cancelAnalysis = (analysisId: string) => {
    setRecentMeals(prevMeals => prevMeals.filter(meal => meal.id !== analysisId));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectedMealsForDeletion.length > 0) {
        const target = event.target as HTMLElement;
        const clickedOnMealCard = recentMeals.some(meal => {
          const cardElement = document.querySelector(`[data-meal-card-id="${meal.id}"]`);
          return cardElement && cardElement.contains(target);
        });
        const clickedOnTrashArea = target.closest('#delete-trash-area-dashboard');

        if (!clickedOnMealCard && !clickedOnTrashArea) {
          setSelectedMealsForDeletion([]);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    const touchStartListener = handleClickOutside as unknown as EventListener;
    document.addEventListener('touchstart', touchStartListener);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', touchStartListener);
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, [selectedMealsForDeletion, recentMeals]);


  let calorieStatus: { value: number; label: string; isOver: boolean; textColor: string };

  if (userGoals.calories > 0) {
    if (dailyTotals.calories > userGoals.calories) {
      calorieStatus = {
        value: dailyTotals.calories - userGoals.calories,
        label: 'Cals Over',
        isOver: true,
        textColor: 'text-destructive',
      };
    } else {
      calorieStatus = {
        value: userGoals.calories - dailyTotals.calories,
        label: 'Cals Left',
        isOver: false,
        textColor: 'text-primary',
      };
    }
  } else {
    calorieStatus = {
      value: dailyTotals.calories, // Show total consumed if no goal
      label: 'Cals Consumed',
      isOver: false,
      textColor: 'text-foreground', // Neutral color
    };
  }

  const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const weekDates = Array(7).fill(null).map((_, i) => {
    const date = new Date(currentDate);
    const dayIndex = currentDate.getDay();
    date.setDate(currentDate.getDate() - dayIndex + i);
    return date;
  });


  if (isLoadingGoals) {
    return (
      <AppWrapper className="bg-background text-foreground flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </AppWrapper>
    );
  }

  return (
    <AppWrapper className="bg-background text-foreground">
      <header className="bg-card px-6 py-4 flex justify-between items-center border-b sticky top-0 z-10">
        <h1 className="text-2xl font-bold font-headline text-primary">CalSnap</h1>
        <Link href="/profile">
          <Button variant="ghost" size="icon" aria-label="Profile">
            <User className="w-6 h-6 text-primary" />
          </Button>
        </Link>
      </header>

      <main className="p-6 flex-grow overflow-y-auto pb-24 relative">
      <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileSelectedForAnalysis} className="hidden" />
      <canvas ref={canvasRef} className="hidden"></canvas>

        <div className="flex justify-between items-center mb-6">
          {weekDates.map((dateItem) => (
             <DayButton
              key={dateItem.toISOString()}
              day={daysOfWeek[dateItem.getDay()]}
              date={dateItem.getDate()}
              isActive={dateItem.toDateString() === currentDate.toDateString()}
              onClick={() => {setSelectedMealsForDeletion([]); setCurrentDate(dateItem);}}
            />
          ))}
        </div>

        {userGoals.calories === 0 ? (
           <Card className="rounded-3xl p-6 mb-6 shadow-lg bg-secondary">
            <CardContent className="p-0 text-center">
              <h3 className="text-xl font-bold mb-2">Set Up Your Profile!</h3>
              <p className="text-muted-foreground mb-4">Complete the onboarding to get personalized calorie goals.</p>
              <Link href="/onboarding/gender">
                <Button>Start Onboarding</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
        <Card className="rounded-3xl p-6 mb-6 shadow-lg bg-card">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div className="relative">
                 <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" strokeWidth="8" fill="transparent" className="stroke-secondary" />
                  <circle
                    cx="50" cy="50" r="45" strokeWidth="8" fill="transparent"
                    className={cn("stroke-primary", calorieStatus.isOver && userGoals.calories > 0 && "stroke-destructive")}
                    strokeDasharray={2 * Math.PI * 45}
                    strokeDashoffset={(2 * Math.PI * 45) * (1 - (userGoals.calories > 0 ? Math.min(dailyTotals.calories, userGoals.calories) / userGoals.calories : 0) )}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <div className={cn("flex items-center", calorieStatus.textColor)}>
                    {calorieStatus.isOver && userGoals.calories > 0 && <AlertTriangle className="w-5 h-5 mr-1" />}
                    <span className="text-2xl font-bold">{calorieStatus.value}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{calorieStatus.label}</span>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { name: 'Protein', current: dailyTotals.protein, goal: userGoals.protein, colorClass: 'bg-chart-1' },
                  { name: 'Fat', current: dailyTotals.fat, goal: userGoals.fat, colorClass: 'bg-chart-4' },
                  { name: 'Carbs', current: dailyTotals.carbohydrates, goal: userGoals.carbohydrates, colorClass: 'bg-chart-3' },
                ].map(macro => {
                  const isOverGoal = macro.current > macro.goal && macro.goal > 0;
                  return (
                    <div key={macro.name}>
                      <div className="text-sm font-semibold mb-0.5">{macro.name}</div>
                      <div className="text-xs text-muted-foreground flex items-center">
                        <span className={cn(isOverGoal && "text-destructive font-semibold")}>{Math.round(macro.current)}</span>
                        <span>/{macro.goal}g</span>
                        {isOverGoal && <AlertTriangle className="w-3 h-3 text-destructive ml-1" />}
                      </div>
                      <Progress
                        value={macro.goal > 0 ? Math.min((macro.current / macro.goal) * 100, 100) : 0}
                        className="w-24 h-1.5 rounded-full bg-secondary"
                        indicatorClassName={cn(macro.colorClass, isOverGoal && "bg-destructive")}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
        )}

        <div className="mb-6">
          <h3 className="text-xl font-bold mb-4 font-headline">Recently Added</h3>
          {(recentMeals.length === 0 || recentMeals.every(m => m.isAnalyzingPlaceholder && format(new Date(m.timestamp), 'yyyy-MM-dd') !== format(currentDate, 'yyyy-MM-dd'))) && !recentMeals.some(m => m.isAnalyzingPlaceholder && format(new Date(m.timestamp), 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd')) ? (
            <Card className="bg-secondary rounded-3xl p-8 text-center">
              <CardContent className="p-0 flex flex-col items-center">
                <Camera className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h4 className="text-lg font-bold mb-2">No meals yet!</h4>
                <p className="text-muted-foreground text-sm">Tap the '+' to add your first meal for {format(currentDate, "MMMM do")}.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {recentMeals.map(meal => {
                if (meal.isAnalyzingPlaceholder) {
                  if (format(new Date(meal.timestamp), 'yyyy-MM-dd') !== format(currentDate, 'yyyy-MM-dd')) return null;
                  return (
                    <Card key={meal.id} className="rounded-2xl shadow-md bg-card p-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-20 h-20 relative rounded-lg overflow-hidden bg-secondary flex items-center justify-center flex-shrink-0">
                          {meal.photoDataUri && <Image src={meal.photoDataUri} alt="Analyzing meal" layout="fill" className="object-cover opacity-50" />}
                          <Loader2 className="w-10 h-10 text-primary animate-spin absolute" />
                        </div>
                        <div className="flex-grow space-y-1.5">
                          <div className="flex justify-between items-start">
                            <p className="font-semibold text-sm text-foreground">{meal.name}</p>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => cancelAnalysis(meal.id)}>
                              <CancelIcon size={18} />
                            </Button>
                          </div>
                          <Skeleton className="h-4 w-3/4 bg-muted/70" />
                          <div className="flex space-x-2">
                            <Skeleton className="h-3 w-1/4 bg-muted/60" />
                            <Skeleton className="h-3 w-1/4 bg-muted/60" />
                            <Skeleton className="h-3 w-1/4 bg-muted/60" />
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                }
                if (format(new Date(meal.timestamp), 'yyyy-MM-dd') !== format(currentDate, 'yyyy-MM-dd')) return null;

                const isSelected = selectedMealsForDeletion.includes(meal.id);
                return (
                <Card
                  key={meal.id}
                  data-meal-card-id={meal.id}
                  className={cn(
                    "rounded-2xl shadow-md hover:shadow-lg transition-all bg-card cursor-pointer",
                    isSelected && "ring-2 ring-destructive shadow-xl scale-105"
                  )}
                  onMouseDown={() => handleInteractionStart(meal.id)}
                  onMouseUp={(e) => handleInteractionEnd(meal.id, e)}
                  onTouchStart={() => handleInteractionStart(meal.id)}
                  onTouchEnd={(e) => handleInteractionEnd(meal.id, e)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    isLongPressRef.current = true; // Treat right-click as long press
                    setSelectedMealsForDeletion(prev => prev.includes(meal.id) ? prev : [...prev, meal.id]);
                  }}
                >
                  <div className="p-3 flex items-stretch space-x-3">
                    <Link 
                        href={`/meal/${meal.id}`} 
                        className="flex-shrink-0" 
                        onClick={(e) => { if(selectedMealsForDeletion.length > 0) e.preventDefault();}}
                        draggable="false"
                    >
                        {meal.photoDataUri && (
                        <div className="w-20 h-20 relative rounded-lg overflow-hidden">
                            <Image src={meal.photoDataUri} alt={meal.name || "Logged meal"} layout="fill" className="object-cover" />
                        </div>
                        )}
                    </Link>
                    <div className="flex-grow flex flex-col justify-between py-0.5 min-w-0">
                        <Link 
                            href={`/meal/${meal.id}`} 
                            className="block" 
                            onClick={(e) => { if(selectedMealsForDeletion.length > 0) e.preventDefault();}}
                            draggable="false"
                        >
                        <div>
                            <div className="flex justify-between items-start mb-0.5">
                                <p className="font-semibold text-sm leading-tight text-foreground truncate flex-1 min-w-0 mr-2">{meal.name || "Unnamed Meal"}</p>
                                <p className="text-xs text-muted-foreground flex-shrink-0">{format(new Date(meal.timestamp), 'HH:mm')}</p>
                            </div>
                            <p className="text-lg font-bold text-primary">{meal.calories} Calories</p>
                        </div>
                        <div className="flex items-center space-x-3 mt-1">
                            <div className="flex items-center">
                            <MacroIcon letter="P" bgColorClass="bg-chart-1" />
                            <span className="text-xs text-muted-foreground">{meal.protein}g</span>
                            </div>
                            <div className="flex items-center">
                            <MacroIcon letter="F" bgColorClass="bg-chart-4" />
                            <span className="text-xs text-muted-foreground">{meal.fat}g</span>
                            </div>
                            <div className="flex items-center">
                            <MacroIcon letter="C" bgColorClass="bg-chart-3" />
                            <span className="text-xs text-muted-foreground">{meal.carbohydrates}g</span>
                            </div>
                        </div>
                        </Link>
                    </div>
                  </div>
                </Card>
              );
            })}
            </div>
          )}
        </div>
      </main>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20">
        <Sheet open={isAddMealSheetOpen} onOpenChange={setIsAddMealSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="default" size="icon" className="bg-primary p-4 rounded-full shadow-lg h-14 w-14" aria-label="Add new meal">
              <Plus className="w-7 h-7 text-primary-foreground" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl h-auto p-0 bg-card">
            <SheetHeader className="pt-4 px-5 pb-0 text-center">
              <div aria-hidden="true" className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-muted-foreground/30" />
              <SheetTitle className="text-lg font-semibold">Add Meal Options</SheetTitle>
            </SheetHeader>
            <div className="p-5 pt-3 space-y-1">
              <Button variant="ghost" className="w-full justify-start text-lg h-auto py-4 pl-3 text-card-foreground hover:bg-secondary" onClick={openCameraModal}>
                <Camera className="mr-4 h-6 w-6 text-muted-foreground" /> Camera
              </Button>
              <Button variant="ghost" className="w-full justify-start text-lg h-auto py-4 pl-3 text-card-foreground hover:bg-secondary" onClick={() => { setIsAddMealSheetOpen(false); fileInputRef.current?.click(); }}>
                <LibraryBig className="mr-4 h-6 w-6 text-muted-foreground" /> Album
              </Button>
              <Link href="/describe-meal" passHref onClick={() => setIsAddMealSheetOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-lg h-auto py-4 pl-3 text-card-foreground hover:bg-secondary">
                  <PenSquare className="mr-4 h-6 w-6 text-muted-foreground" /> Describe food
                </Button>
              </Link>
              <Link href="/favorites" passHref onClick={() => setIsAddMealSheetOpen(false)}>
                 <Button variant="ghost" className="w-full justify-start text-lg h-auto py-4 pl-3 text-card-foreground hover:bg-secondary">
                  <Heart className="mr-4 h-6 w-6 text-muted-foreground" /> Favorites
                </Button>
              </Link>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {selectedMealsForDeletion.length > 0 && (
        <div id="delete-trash-area-dashboard" className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-sm border-t border-border flex justify-center items-center z-30">
          <Button
            variant="destructive"
            size="lg"
            className="w-auto px-8 py-4 rounded-xl"
            onClick={openDeleteDialog}
          >
            <Trash2 className="mr-3 h-6 w-6" /> Delete ({selectedMealsForDeletion.length}) Selected
          </Button>
        </div>
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={(open) => {
          setIsDeleteDialogOpen(open);
          if (!open) {
            // Don't clear selection here, user might just cancel the dialog
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitleComponent>Delete Selected Meal(s)?</AlertDialogTitleComponent>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected {selectedMealsForDeletion.length} meal(s).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteMeal} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isCameraModalOpen} onOpenChange={(open) => {
        setIsCameraModalOpen(open);
        if (!open && cameraStream) {
          cameraStream.getTracks().forEach(track => track.stop());
          setCameraStream(null);
        }
      }}>
        <DialogContent className="p-0 border-0 max-w-md w-full bg-card">
           <DialogHeaderComponent className="p-4 border-b">
            <DialogTitleComponent className="text-lg font-semibold">Take Photo</DialogTitleComponent>
          </DialogHeaderComponent>
          <div className="p-4">
            <video ref={videoRef} className="w-full aspect-video rounded-md bg-secondary mb-4" autoPlay muted playsInline />
            {hasCameraPermission === false && (
              <Alert variant="destructive" className="mb-4">
                <AlertTitle>Camera Access Denied</AlertTitle>
                <AlertDescription>
                  Please enable camera permissions in your browser settings. You may need to refresh the page.
                </AlertDescription>
              </Alert>
            )}
             {hasCameraPermission === null && (
                <div className="flex justify-center items-center h-32">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="ml-2 text-muted-foreground">Requesting camera...</p>
                </div>
            )}
          </div>
          {hasCameraPermission === true && (
            <DialogFooter className="p-4 border-t">
              <Button variant="outline" onClick={() => {
                  setIsCameraModalOpen(false);
                  if (cameraStream) cameraStream.getTracks().forEach(track => track.stop());
                  setCameraStream(null);
              }}>Cancel</Button>
              <Button onClick={handleCapturePhoto} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Check className="mr-2 h-5 w-5" /> Capture
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

    </AppWrapper>
  );
}

    