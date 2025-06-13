"use server";

import { generateCategoryQuestions as genkitGenerateCategoryQuestions } from "@/ai/flows/generate-category-questions";
import type { GenerateCategoryQuestionsInput, GenerateCategoryQuestionsOutput } from "@/ai/flows/generate-category-questions";
import { summarizeFeedback as genkitSummarizeFeedback } from "@/ai/flows/summarize-feedback";
import type { SummarizeFeedbackInput, SummarizeFeedbackOutput } from "@/ai/flows/summarize-feedback";

// The getApiKey function is no longer needed here as the API key is configured
// directly in the Genkit OpenRouter plugin (src/ai/genkit.ts)
// and sourced from process.env.OPENROUTER_API_KEY.

export async function generateQuestionsAction(
  category: GenerateCategoryQuestionsInput["category"],
  coreValues: string,
  qualitySubsets: string,
  numQuestions: number
): Promise<GenerateCategoryQuestionsOutput> {
  try {
    // API key is handled by the Genkit OpenRouter plugin configuration.
    // The 'apiKey' field has been removed from GenerateCategoryQuestionsInput schema.
    const input: GenerateCategoryQuestionsInput = { category, coreValues, qualitySubsets, count: numQuestions };
    const result = await genkitGenerateCategoryQuestions(input);
    return result;
  } catch (error) {
    console.error("Error generating questions:", error);
    // Check if error has a message property
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { questions: [`Failed to generate questions: ${errorMessage}`] };
  }
}

export async function summarizeFeedbackAction(
  feedback: string,
  category: SummarizeFeedbackInput["category"]
): Promise<SummarizeFeedbackOutput> {
  try {
    // API key is handled by the Genkit OpenRouter plugin configuration.
    // The 'apiKey' field has been removed from SummarizeFeedbackInput schema.
    const input: SummarizeFeedbackInput = { feedback, category };
    const result = await genkitSummarizeFeedback(input);
    return result;
  } catch (error) {
    console.error("Error summarizing feedback:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { summary: `Failed to generate summary: ${errorMessage}` };
  }
}
