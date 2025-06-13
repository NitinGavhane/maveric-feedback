// src/ai/flows/generate-category-questions.ts
'use server';
/**
 * @fileOverview AI flow to generate questions based on the selected feedback category.
 *
 * - generateCategoryQuestions - A function that handles the question generation process.
 * - GenerateCategoryQuestionsInput - The input type for the generateCategoryQuestions function.
 * - GenerateCategoryQuestionsOutput - The return type for the generateCategoryQuestions function.
 */

import {ai} from '../genkit'; // Updated import path
import {z} from 'genkit';
import { MIN_QUESTIONS_TO_GENERATE, MAX_QUESTIONS_TO_GENERATE } from '@/config/site';
import { storeQuestions } from '@/lib/questions';

const GenerateCategoryQuestionsInputSchema = z.object({
  category: z.enum(['Leadership', 'Delivery', 'Vendor Management']).describe('The feedback category selected by the user.'),
  coreValues: z.string().describe('Core values defined by the administrator.'),
  qualitySubsets: z.string().describe('Quality-focused subsets managed by the administrator.'),
  count: z.number().int().min(MIN_QUESTIONS_TO_GENERATE).max(MAX_QUESTIONS_TO_GENERATE).describe(`The number of questions to generate, between ${MIN_QUESTIONS_TO_GENERATE} and ${MAX_QUESTIONS_TO_GENERATE}.`)
});
export type GenerateCategoryQuestionsInput = z.infer<typeof GenerateCategoryQuestionsInputSchema>;

const GenerateCategoryQuestionsOutputSchema = z.object({
  questions: z.array(z.string()).describe('An array of generated questions based on the selected category.'),
});
export type GenerateCategoryQuestionsOutput = z.infer<typeof GenerateCategoryQuestionsOutputSchema>;

export const generateCategoryQuestions = ai.defineFlow(
  {
    name: 'generate-category-questions',
    inputSchema: z.object({
      category: z.string(),
      count: z.number().min(1).max(10).default(5),
    }),
    outputSchema: z.object({
      questions: z.array(z.string()),
    }),
  },
  async (params) => {
    const { category, count } = params;

    const prompt = `Generate ${count} specific questions for the category "${category}". 
    Each question should be clear, concise, and directly related to ${category}.
    Format the response as a JSON array of strings.`;

    const response = await ai.generate(prompt);

    const content = response.text;
    if (!content) {
      throw new Error('No response from AI model');
    }

    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        // Filter out any empty strings or strings with only whitespace from the parsed array
        const filteredQuestions = parsed.map((q: string) => q.trim()).filter((q: string) => q.length > 0);
        // Apply one final filter just in case
        const finalFilteredQuestions = filteredQuestions.filter((q: string) => q.length > 0);
        // Apply a strict final filter to ensure only non-empty strings are returned
        const strictlyFilteredQuestions = finalFilteredQuestions.filter((q) => typeof q === 'string' && q.trim().length > 0);
        return { questions: strictlyFilteredQuestions };
      }
    } catch (e) {
      const questions = content
        .split('\n')
        .map((line: string) => line.trim())
        .filter((line: string) => line.length > 0 && !line.startsWith('```'))
        .map((line: string) => line.replace(/^[0-9]+\.\s*/, ''))
        .map((line: string) => line.replace(/[[\]]/g, ''));

      // Add a final filter to remove any remaining empty/whitespace lines
      const filteredQuestions = questions.filter((q: string) => q.trim().length > 0);

      // Apply one final filter just in case
      const finalFilteredQuestions = filteredQuestions.filter((q: string) => q.length > 0);

      // Apply a strict final filter to ensure only non-empty strings are returned
      const strictlyFilteredQuestions = finalFilteredQuestions.filter((q) => typeof q === 'string' && q.trim().length > 0);
      return { questions: strictlyFilteredQuestions };
    }

    throw new Error('Failed to parse AI response into questions');
  }
);
