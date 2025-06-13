// Summarize feedback flow using Genkit and Gemini.
'use server';

/**
 * @fileOverview Summarizes customer feedback using AI.
 *
 * - summarizeFeedback - A function that takes raw feedback as input and returns a summarized version.
 * - SummarizeFeedbackInput - The input type for the summarizeFeedback function.
 * - SummarizeFeedbackOutput - The return type for the summarizeFeedback function.
 */

import {ai} from '../genkit'; // Updated import path
import {z} from 'genkit';

const SummarizeFeedbackInputSchema = z.object({
  feedback: z.string().describe('The raw feedback text provided by the customer.'),
  category: z.enum(['Leadership', 'Delivery', 'Vendor Management']).describe('The category of the feedback.'),
});
export type SummarizeFeedbackInput = z.infer<typeof SummarizeFeedbackInputSchema>;

const SummarizeFeedbackOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the customer feedback.'),
});
export type SummarizeFeedbackOutput = z.infer<typeof SummarizeFeedbackOutputSchema>;

export async function summarizeFeedback(input: SummarizeFeedbackInput): Promise<SummarizeFeedbackOutput> {
  return summarizeMaveric(input);
}

const summarizeFeedbackPrompt = ai.definePrompt({
  name: 'summarizeFeedbackPrompt',
  input: {schema: SummarizeFeedbackInputSchema},
  output: {schema: SummarizeFeedbackOutputSchema},
  prompt: `You are an AI assistant tasked with summarizing customer feedback.

  Summarize the following feedback, focusing on the key points and sentiment expressed by the customer. The feedback is related to the {{category}} category. Keep the summary concise and easy to understand.

  Feedback: {{{feedback}}}`,
});

const summarizeMaveric = ai.defineFlow(
  {
    name: 'summarizeMaveric',
    inputSchema: SummarizeFeedbackInputSchema,
    outputSchema: SummarizeFeedbackOutputSchema,
  },
  async input => {
    // API key is now handled by the Genkit plugin configuration.
    const {output} = await summarizeFeedbackPrompt(input);
    return output!;
  }
);
