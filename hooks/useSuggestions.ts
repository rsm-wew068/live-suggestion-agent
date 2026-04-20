"use client";

import { useCallback, useRef, useState } from "react";
import { SuggestionBatch, TranscriptEntry, Settings } from "@/lib/types";
import { SUGGESTION_SYSTEM_PROMPT } from "@/lib/prompts";
import { formatTranscript } from "./useTranscript";

function ts(): string {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function useSuggestions(
  transcript: TranscriptEntry[],
  settings: Settings,
  recording: boolean
) {
  const [batches, setBatches] = useState<SuggestionBatch[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [countdown, setCountdown] = useState(settings.refreshInterval);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const transcriptText = formatTranscript(transcript, Infinity);

  const fetchSuggestions = useCallback(
    async (currentTranscript: string) => {
      if (!settings.apiKey || !currentTranscript.trim() || loadingSuggestions)
        return;
      setLoadingSuggestions(true);
      try {
        const context = formatTranscript(
          transcript,
          settings.suggestionContextWindow
        );

        const prevPreviews = batches
          .slice(0, 2)
          .flatMap((b) => b.suggestions.map((s) => s.preview));
        const prevBlock =
          prevPreviews.length > 0
            ? `\n\nPreviously suggested (avoid repeating these):\n${prevPreviews.map((p) => `- "${p}"`).join("\n")}`
            : "";

        const userPrompt = settings.suggestionPrompt
          .replace("{transcript}", context)
          .replace("{previous_suggestions}", prevBlock);

        const finalUserPrompt = settings.suggestionPrompt.includes(
          "{previous_suggestions}"
        )
          ? userPrompt
          : userPrompt + prevBlock;

        const res = await fetch("/api/suggest", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": settings.apiKey,
          },
          body: JSON.stringify({
            systemPrompt: SUGGESTION_SYSTEM_PROMPT,
            userPrompt: finalUserPrompt,
          }),
        });
        const data = await res.json();
        if (data.suggestions?.length > 0) {
          const recentPreviews = batches
            .slice(0, 2)
            .flatMap((b) =>
              b.suggestions.map((s) => s.preview.toLowerCase().split(/\s+/))
            );
          const filtered = data.suggestions.filter(
            (s: { preview: string }) => {
              const words = s.preview.toLowerCase().split(/\s+/);
              return !recentPreviews.some((prev) => {
                const overlap = words.filter((w: string) =>
                  prev.includes(w)
                ).length;
                return overlap / Math.max(words.length, prev.length) > 0.7;
              });
            }
          );
          if (filtered.length > 0) {
            setBatches((prev) => [
              {
                id: crypto.randomUUID(),
                timestamp: ts(),
                suggestions: filtered,
              },
              ...prev,
            ]);
          }
        }
      } catch (err) {
        console.error("Suggestions error:", err);
      } finally {
        setLoadingSuggestions(false);
      }
    },
    [
      settings.apiKey,
      settings.suggestionPrompt,
      settings.suggestionContextWindow,
      loadingSuggestions,
      transcript,
      batches,
    ]
  );

  // Auto-refresh countdown
  const startCountdown = useCallback(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setCountdown(settings.refreshInterval);
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchSuggestions(transcriptText);
          return settings.refreshInterval;
        }
        return prev - 1;
      });
    }, 1000);
  }, [fetchSuggestions, transcriptText, settings.refreshInterval]); // eslint-disable-line react-hooks/exhaustive-deps

  const stopCountdown = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setCountdown(settings.refreshInterval);
  }, [settings.refreshInterval]);

  // Fetch on transcript change
  const prevLengthRef = useRef(0);
  const onTranscriptChange = useCallback(() => {
    if (
      transcript.length > prevLengthRef.current &&
      transcript.length > 0
    ) {
      const timer = setTimeout(() => {
        fetchSuggestions(transcriptText);
      }, 2000);
      prevLengthRef.current = transcript.length;
      return () => clearTimeout(timer);
    }
    prevLengthRef.current = transcript.length;
  }, [transcript.length, fetchSuggestions, transcriptText]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleReload = useCallback(() => {
    setCountdown(settings.refreshInterval);
    fetchSuggestions(transcriptText);
  }, [fetchSuggestions, transcriptText, settings.refreshInterval]);

  return {
    batches,
    loadingSuggestions,
    countdown,
    fetchSuggestions,
    handleReload,
    startCountdown,
    stopCountdown,
    onTranscriptChange,
  };
}
