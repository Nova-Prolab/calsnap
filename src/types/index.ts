
export interface Meal {
  id: string;
  name?: string; // Optional name for the meal
  photoDataUri?: string; // If photo was used
  calories: number;
  protein: number;
  fat: number;
  carbohydrates: number;
  timestamp: number;
}

export interface DailyTotals {
  calories: number;
  protein: number;
  fat: number;
  carbohydrates: number;
}

export interface CalorieGoals {
  calories: number;
  protein: number;
  fat: number;
  carbohydrates: number;
}

export type Gender = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extra_active';
export type Goal = 'lose_weight' | 'maintain_weight' | 'gain_weight';

export interface OnboardingData {
  gender?: Gender;
  age?: number; // in years
  height?: number; // in cm
  weight?: number; // in kg
  activityLevel?: ActivityLevel;
  goal?: Goal;
}
