
import type { FEEDBACK_CATEGORIES } from "@/config/site";

export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];

export interface Question {
  id: string;
  text: string;
  type: 'text' | 'rating' | 'voice'; // For future expansion
}

export interface Answer {
  questionId: string;
  textAnswer?: string;
  ratingAnswer?: number;
  voiceTranscript?: string;
}

export interface Feedback {
  name: string;
  email: string;
  category: FeedbackCategory;
  answers: Answer[];
  submittedAt: Date;
  summary?: string; // AI generated summary
}
