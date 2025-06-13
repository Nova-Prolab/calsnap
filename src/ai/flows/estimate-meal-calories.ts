
'use server';

/**
 * @fileOverview A flow for estimating the calorie count, macronutrient breakdown, suggesting a name, and listing ingredients for a meal from a photo.
 *
 * - estimateMealCalories - A function that handles the meal calorie estimation process.
 * - EstimateMealCaloriesInput - The input type for the estimateMealCalories function.
 * - EstimateMealCaloriesOutput - The return type for the estimateMealCalories function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EstimateMealCaloriesInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a meal, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type EstimateMealCaloriesInput = z.infer<typeof EstimateMealCaloriesInputSchema>;

const IngredientSchema = z.object({
  name: z.string().describe('The name of the ingredient.'),
  quantity: z.string().optional().describe('The estimated quantity of the ingredient (e.g., "100", "1/2", "2").'),
  unit: z.string().optional().describe('The unit for the quantity (e.g., "g", "cup", "oz", "piece", "slice").'),
  calories: z.number().optional().describe('The estimated calorie count of the ingredient, if available.'),
});

const EstimateMealCaloriesOutputSchema = z.object({
  suggestedName: z.string().optional().describe('A short, descriptive name for the meal (e.g., "Chicken Salad", "Spaghetti Bolognese").'),
  calorieEstimate: z.number().describe('The estimated total calorie count of the meal.'),
  macronutrientBreakdown: z.object({
    protein: z.number().describe('The estimated protein content of the meal in grams.'),
    fat: z.number().describe('The estimated fat content of the meal in grams.'),
    carbohydrates: z.number().describe('The estimated carbohydrate content of the meal in grams.'),
  }).describe('The estimated macronutrient breakdown of the meal.'),
  ingredients: z.array(IngredientSchema).optional().describe('A list of identified ingredients with their estimated quantity, unit, and calorie counts, if available.'),
});
export type EstimateMealCaloriesOutput = z.infer<typeof EstimateMealCaloriesOutputSchema>;

export async function estimateMealCalories(input: EstimateMealCaloriesInput): Promise<EstimateMealCaloriesOutput> {
  return estimateMealCaloriesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'estimateMealCaloriesPrompt',
  input: {schema: EstimateMealCaloriesInputSchema},
  output: {schema: EstimateMealCaloriesOutputSchema},
  prompt: `You are an AI assistant that estimates the calorie count, macronutrient breakdown, suggests a name, and lists ingredients for a meal from a photo.

  Analyze the following photo of a meal and provide:
  1. A suggested short, descriptive name for the meal (e.g., "Chicken Salad", "Spaghetti Bolognese").
  2. An estimate of its total calorie count.
  3. Its macronutrient breakdown (protein, fat, and carbohydrates in grams).
  4. A list of identified ingredients. For each ingredient, provide its name, estimated quantity (e.g., "100", "1/2", "2"), the unit for the quantity (e.g., "g", "cup", "oz", "piece", "slice"), and an estimated calorie count if possible. Format this as an array of objects.

  Photo: {{media url=photoDataUri}}

  Ensure the calorie estimate and macronutrient breakdown are realistic and appropriate for the meal depicted in the photo.
  The suggested name should be concise and accurately reflect the meal.
  The ingredient list should be as accurate as possible based on the visual information, including quantity and unit where applicable.

  Output the suggested name, calorie estimate as a number, the macronutrient breakdown as an object with protein, fat, and carbohydrates (each as a number in grams), and the list of ingredients according to the schema.

  Follow the schema provided. Do not include any additional information or explanations in your response.
  `,
});

const estimateMealCaloriesFlow = ai.defineFlow(
  {
    name: 'estimateMealCaloriesFlow',
    inputSchema: EstimateMealCaloriesInputSchema,
    outputSchema: EstimateMealCaloriesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

