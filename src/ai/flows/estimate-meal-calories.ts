
'use server';

/**
 * @fileOverview A flow for estimating the calorie count, macronutrient breakdown, and suggesting a name for a meal from a photo.
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

const EstimateMealCaloriesOutputSchema = z.object({
  suggestedName: z.string().optional().describe('A short, descriptive name for the meal (e.g., "Chicken Salad", "Spaghetti Bolognese").'),
  calorieEstimate: z.number().describe('The estimated calorie count of the meal.'),
  macronutrientBreakdown: z.object({
    protein: z.number().describe('The estimated protein content of the meal in grams.'),
    fat: z.number().describe('The estimated fat content of the meal in grams.'),
    carbohydrates: z.number().describe('The estimated carbohydrate content of the meal in grams.'),
  }).describe('The estimated macronutrient breakdown of the meal.'),
});
export type EstimateMealCaloriesOutput = z.infer<typeof EstimateMealCaloriesOutputSchema>;

export async function estimateMealCalories(input: EstimateMealCaloriesInput): Promise<EstimateMealCaloriesOutput> {
  return estimateMealCaloriesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'estimateMealCaloriesPrompt',
  input: {schema: EstimateMealCaloriesInputSchema},
  output: {schema: EstimateMealCaloriesOutputSchema},
  prompt: `You are an AI assistant that estimates the calorie count and macronutrient breakdown of a meal from a photo.
  You also suggest a short, descriptive name for the meal (e.g., "Chicken Salad", "Spaghetti Bolognese").

  Analyze the following photo of a meal and provide an estimate of its calorie count, macronutrient breakdown (protein, fat, and carbohydrates), and a suggested name.

  Photo: {{media url=photoDataUri}}

  Ensure the calorie estimate and macronutrient breakdown are realistic and appropriate for the meal depicted in the photo.
  The suggested name should be concise and accurately reflect the meal.

  Output the suggested name, calorie estimate as a number, and the macronutrient breakdown as an object with protein, fat, and carbohydrates, each as a number in grams.

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

