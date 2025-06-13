
'use server';

/**
 * @fileOverview A flow for estimating the calorie count, macronutrient breakdown, suggesting a name, listing ingredients, and providing a health score for a meal from a textual description.
 *
 * - estimateMealCaloriesFromText - A function that handles the meal calorie estimation process from text.
 * - EstimateMealCaloriesFromTextInput - The input type for the estimateMealCaloriesFromText function.
 * - EstimateMealCaloriesOutput (shared) - The return type, shared with image-based estimation.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { EstimateMealCaloriesOutput } from './estimate-meal-calories'; // Re-use the output schema
import { EstimateMealCaloriesOutputSchema, IngredientSchema } from './estimate-meal-calories'; // Re-use the output schema


const EstimateMealCaloriesFromTextInputSchema = z.object({
  description: z.string().describe('A textual description of the meal (e.g., "A bowl of oatmeal with berries and nuts", "Pepperoni pizza, 2 slices").'),
});
export type EstimateMealCaloriesFromTextInput = z.infer<typeof EstimateMealCaloriesFromTextInputSchema>;


export async function estimateMealCaloriesFromText(input: EstimateMealCaloriesFromTextInput): Promise<EstimateMealCaloriesOutput> {
  return estimateMealCaloriesFromTextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'estimateMealCaloriesFromTextPrompt',
  input: {schema: EstimateMealCaloriesFromTextInputSchema},
  output: {schema: EstimateMealCaloriesOutputSchema}, // Use the shared output schema
  prompt: `You are an AI assistant that estimates the calorie count, macronutrient breakdown, suggests a name, lists ingredients, provides a health score, and offers brief explanations for these estimations for a meal from a textual description.

  Analyze the following meal description and provide:
  1. A suggested short, descriptive name for the meal based on the description.
  2. An estimate of its total calorie count.
  3. Its macronutrient breakdown (protein, fat, and carbohydrates in grams).
  4. A list of identified ingredients. For each ingredient, provide its name, estimated quantity (e.g., "100", "1/2", "2"), the unit for the quantity (e.g., "g", "cup", "oz", "piece", "slice"), and an estimated calorie count if possible. Format this as an array of objects.
  5. A health score from 0 to 10, considering nutritional balance and food quality.
  6. Brief, one-sentence explanations for why the meal received its estimated calorie count, protein, fat, carbohydrates, and health score.

  Meal Description: {{{description}}}

  Ensure the calorie estimate and macronutrient breakdown are realistic and appropriate for the meal described.
  The suggested name should be concise and accurately reflect the meal.
  The ingredient list should be as accurate as possible based on the description.
  The health score should be an integer between 0 and 10.
  The explanations should be concise and directly related to the description and common nutritional knowledge.

  Output all information according to the schema.
  Follow the schema provided. Do not include any additional information or explanations in your response beyond what is requested in the schema fields.
  `,
});

const estimateMealCaloriesFromTextFlow = ai.defineFlow(
  {
    name: 'estimateMealCaloriesFromTextFlow',
    inputSchema: EstimateMealCaloriesFromTextInputSchema,
    outputSchema: EstimateMealCaloriesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
