

export interface MealIngredient {
  name: string;
  quantity?: string;
  unit?: string;
  calories?: number;
}

export interface Meal {
  id: string;
  name?: string;
  photoDataUri?: string;
  description?: string; // Added for described meals
  calories: number;
  protein: number;
  fat: number;
  carbohydrates: number;
  timestamp: number;
  ingredients?: MealIngredient[];
  healthScore?: number;
  isFavorite?: boolean;
  calorieExplanation?: string;
  proteinExplanation?: string;
  fatExplanation?: string;
  carbohydratesExplanation?: string;
  healthScoreExplanation?: string;
  isAnalyzingPlaceholder?: boolean;
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
  age?: number;
  height?: number;
  weight?: number;
  activityLevel?: ActivityLevel;
  goal?: Goal;
}
