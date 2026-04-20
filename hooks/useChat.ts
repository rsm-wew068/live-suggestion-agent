"use client";

import { useCallback, useState } from "react";
import {
  ChatMessage,
  SuggestionBatch,
  TranscriptEntry,
  Settings,
} from "@/lib/types";
import { TYPE_LABELS } from "@/lib/constants";
import { formatTranscript } from "./useTranscript";
import { streamChatResponse } from "@/lib/stream";

function ts(): string {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function useChat(
  transcript: TranscriptEntry[],
  settings: Settings
) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);

  const handleSuggestionClick = useCallback(
    async (batch: SuggestionBatch, index: number) => {
      const suggestion = batch.suggestions[index];
      if (!suggestion) return;

      const assistantId = crypto.randomUUID();

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "user",
          content: suggestion.preview,
          timestamp: ts(),
          suggestionType: suggestion.type as ChatMessage["suggestionType"],
          suggestionLabel: TYPE_LABELS[suggestion.type] || suggestion.type,
        },
        {
          id: assistantId,
          role: "assistant",
          content: "",
          timestamp: ts(),
        },
      ]);

      const context = formatTranscript(transcript, settings.detailContextWindow);
      const systemPrompt = settings.detailPrompt
        .replace("{suggestion_preview}", suggestion.preview)
        .replace("{suggestion_type}", suggestion.type)
        .replace("{transcript}", context);

      setStreaming(true);
      const safety = setTimeout(() => setStreaming(false), 90_000);
      try {
        const fullText = await streamChatResponse(
          settings.apiKey,
          [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: `Elaborate on: ${suggestion.preview}${suggestion.detail_prompt && suggestion.detail_prompt !== suggestion.preview ? `\n\nFocus areas: ${suggestion.detail_prompt}` : ""}`,
            },
          ],
          (text) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, content: text } : m
              )
            );
          }
        );
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: fullText } : m
          )
        );
      } catch (err) {
        console.error("Chat error:", err);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: "Error: Failed to get response." }
              : m
          )
        );
      } finally {
        clearTimeout(safety);
        setStreaming(false);
      }
    },
    [transcript, settings]
  );

  const handleChatSend = useCallback(
    async (message: string) => {
      const assistantId = crypto.randomUUID();

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "user",
          content: message,
          timestamp: ts(),
        },
        {
          id: assistantId,
          role: "assistant",
          content: "",
          timestamp: ts(),
        },
      ]);

      const context = formatTranscript(transcript, settings.detailContextWindow);
      const systemPrompt = `You are an AI meeting copilot assisting during a live conversation. Answer the user's question using the transcript context below.

Be concise but thorough. Reference specific things said in the conversation when relevant. If the question is about something not in the transcript, give your best general answer.

Full transcript so far:
${context}`;

      setStreaming(true);
      const safety = setTimeout(() => setStreaming(false), 90_000);
      try {
        const chatMessages: Array<{ role: string; content: string }> = [
          { role: "system", content: systemPrompt },
          ...messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          { role: "user", content: message },
        ];

        const fullText = await streamChatResponse(
          settings.apiKey,
          chatMessages,
          (text) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, content: text } : m
              )
            );
          }
        );
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: fullText } : m
          )
        );
      } catch (err) {
        console.error("Chat error:", err);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: "Error: Failed to get response." }
              : m
          )
        );
      } finally {
        clearTimeout(safety);
        setStreaming(false);
      }
    },
    [transcript, settings, messages]
  );

  return { messages, streaming, handleSuggestionClick, handleChatSend };
}
