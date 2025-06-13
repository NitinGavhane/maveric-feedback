
export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Maveric",
  description: "AI-Powered Customer Feedback Assistant",
  // Add other global configs here
};

export const FEEDBACK_CATEGORIES = ["Leadership", "Delivery", "Vendor Management"] as const;
export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];

// Mock admin credentials
export const ADMIN_EMAIL = "admin@Maveric.com";
export const ADMIN_PASSWORD = "password123";

export const DEFAULT_CORE_VALUES = "Integrity, Customer Focus, Innovation, Collaboration, Excellence";
export const DEFAULT_QUALITY_SUBSETS = "Product Quality, Service Speed, Communication Clarity, Problem Resolution";

export const NUM_QUESTIONS_FOR_CHATBOT_PREVIEW = 3;
export const NUM_QUESTIONS_FOR_LIVE_CHATBOT = 3;
export const MAX_QUESTIONS_TO_GENERATE = 10;
export const MIN_QUESTIONS_TO_GENERATE = 1;
