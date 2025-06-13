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
