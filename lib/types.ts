import { DEFAULT_SETTINGS } from "@/lib/prompts";

export type SuggestionType = "QUESTION" | "TALKING_POINT" | "ANSWER" | "FACT_CHECK" | "CLARIFICATION";

export interface Suggestion {
  id: string;
  type: SuggestionType;
  preview: string;
  detail_prompt: string;
}

export interface SuggestionBatch {
  id: string;
  timestamp: string;
  suggestions: Suggestion[];
}

export interface TranscriptEntry {
  timestamp: string;
  text: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  suggestionType?: SuggestionType;
  suggestionLabel?: string;
}

export interface Settings {
  apiKey: string;
  suggestionPrompt: string;
  detailPrompt: string;
  chatPrompt: string;
  suggestionContextWindow: number;
  detailContextWindow: number;
  refreshInterval: number;
}

export { DEFAULT_SETTINGS };
