import {genkit} from 'genkit';
import { gemini15Flash, googleAI } from '@genkit-ai/googleai';

// Use environment variable instead of hardcoding the token
const HUGGINGFACE_API_TOKEN = process.env.HUGGINGFACE_API_TOKEN;

export const ai = genkit({
  plugins: [googleAI()],
  model: gemini15Flash, // set default model
});