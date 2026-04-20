"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TranscriptEntry } from "@/lib/types";

export function formatTranscript(
  entries: TranscriptEntry[],
  charLimit: number
): string {
  const formatted = entries
    .map((e) => `[${e.timestamp}] ${e.text}`)
    .join("\n");
  return formatted.slice(-charLimit);
}

function ts(): string {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function useTranscription(apiKey: string) {
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const apiKeyRef = useRef(apiKey);

  useEffect(() => {
    apiKeyRef.current = apiKey;
  }, [apiKey]);

  const handleAudioChunk = useCallback(async (blob: Blob) => {
    const key = apiKeyRef.current;
    if (!key) return;
    try {
      const formData = new FormData();
      formData.append("file", blob, "audio.webm");
      const res = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "x-api-key": key },
        body: formData,
      });
      const data = await res.json();
      if (data.text && data.text.trim()) {
        setTranscript((prev) => [
          ...prev,
          { timestamp: ts(), text: data.text.trim() },
        ]);
      }
    } catch (err) {
      console.error("Transcription error:", err);
    }
  }, []);

  return { transcript, handleAudioChunk };
}
