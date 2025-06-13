
'use client';

import type { OnboardingData, CalorieGoals, Gender, ActivityLevel, Goal } from '@/types';

// Mifflin-St Jeor Equation for BMR
const calculateBMR = (gender: Gender, weight: number, height: number, age: number): number => {
  if (gender === 'male') {
    return (10 * weight) + (6.25 * height) - (5 * age) + 5;
  } else { // female
    return (10 * weight) + (6.25 * height) - (5 * age) - 161;
  }
};

const activityLevelMultipliers: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extra_active: 1.9,
};

const goalAdjustments: Record<Goal, number> = {
  lose_weight: -500, // Aim for ~0.5kg/week loss
  maintain_weight: 0,
  gain_weight: 300,  // Aim for ~0.25kg/week gain
};

export const calculateCalorieGoals = (data: OnboardingData): CalorieGoals => {
  if (!data.gender || !data.weight || !data.height || !data.age || !data.activityLevel || !data.goal) {
    // Return default or throw error if essential data is missing
    console.warn("Incomplete onboarding data for calorie calculation.");
    return { calories: 0, protein: 0, fat: 0, carbohydrates: 0 };
  }

  const bmr = calculateBMR(data.gender, data.weight, data.height, data.age);
  const tdee = bmr * activityLevelMultipliers[data.activityLevel];
  const targetCalories = Math.round(tdee + goalAdjustments[data.goal]);

  // Macronutrient calculation
  // Protein: 2g per kg of body weight
  const proteinGrams = Math.round(data.weight * 2);
  const proteinCalories = proteinGrams * 4;

  // Fat: 25% of total calories
  const fatCalories = Math.round(targetCalories * 0.25);
  const fatGrams = Math.round(fatCalories / 9);

  // Carbohydrates: Remaining calories
  const carbCalories = targetCalories - proteinCalories - fatCalories;
  const carbGrams = Math.round(carbCalories / 4);
  
  // Ensure no negative values if targetCalories is too low
  return {
    calories: Math.max(0, targetCalories),
    protein: Math.max(0, proteinGrams),
    fat: Math.max(0, fatGrams),
    carbohydrates: Math.max(0, carbGrams),
  };
};
