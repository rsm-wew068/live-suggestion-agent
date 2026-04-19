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

export const DEFAULT_SETTINGS: Omit<Settings, "apiKey"> = {
  suggestionPrompt: `You are an AI meeting copilot analyzing a live conversation. Based on the recent transcript below, generate exactly 3 diverse, useful suggestions.

Analyze the conversation flow and pick the most appropriate mix of these types:
- QUESTION: A thoughtful question to ask next to move the conversation forward
- TALKING_POINT: A relevant fact, data point, or perspective to raise
- ANSWER: A direct, helpful answer if someone just asked something
- FACT_CHECK: Verify, contextualize, or add nuance to a claim that was made
- CLARIFICATION: Additional info, definition, or context that would help the discussion

Guidelines:
- Each suggestion's preview must be self-contained and valuable even without clicking for details
- Make suggestions specific to what was actually said — no generic filler
- Vary the types based on context: if someone asked a question, include an ANSWER; if a claim was made, include a FACT_CHECK; if the conversation is stalling, include a QUESTION or TALKING_POINT
- Previews should be 1-2 sentences, actionable and concrete

Return a JSON array of exactly 3 objects with this schema:
[{"type": "QUESTION|TALKING_POINT|ANSWER|FACT_CHECK|CLARIFICATION", "preview": "...", "detail_prompt": "..."}]

Recent transcript:
{transcript}`,

  detailPrompt: `You are an AI meeting copilot. The user clicked on a suggestion during a live conversation. Using the full transcript context below, provide a detailed, actionable, and insightful response.

Be thorough but concise (3-5 short paragraphs). Include specific data, examples, or actionable steps where relevant. Structure your response clearly.

Suggestion: {suggestion_preview}
Suggestion type: {suggestion_type}

Full transcript so far:
{transcript}`,

  chatPrompt: `You are an AI meeting copilot assisting during a live conversation. Answer the user's question using the transcript context and chat history below.

Be concise but thorough. Reference specific things said in the conversation when relevant. If the question is about something not in the transcript, give your best general answer.

Full transcript so far:
{transcript}

Chat history:
{chat_history}

User question: {message}`,

  suggestionContextWindow: 3000,
  detailContextWindow: 8000,
  refreshInterval: 10,
};
