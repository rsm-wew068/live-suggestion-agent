"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChatMessage,
  SuggestionBatch,
  TranscriptEntry,
  Settings,
  DEFAULT_SETTINGS,
} from "@/lib/types";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import TranscriptPanel from "@/components/TranscriptPanel";
import SuggestionsPanel from "@/components/SuggestionsPanel";
import ChatPanel from "@/components/ChatPanel";
import SettingsModal from "@/components/SettingsModal";
import ExportButton from "@/components/ExportButton";

function loadSettings(): Settings {
  if (typeof window === "undefined") return { ...DEFAULT_SETTINGS, apiKey: "" };
  const saved = localStorage.getItem("twinmind-settings");
  if (saved) {
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch {
      /* ignore */
    }
  }
  return { ...DEFAULT_SETTINGS, apiKey: "" };
}

function ts(): string {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

const TYPE_LABELS: Record<string, string> = {
  QUESTION: "Question to ask",
  TALKING_POINT: "Talking point",
  ANSWER: "Answer",
  FACT_CHECK: "Fact-check",
  CLARIFICATION: "Clarification",
};

export default function Home() {
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [batches, setBatches] = useState<SuggestionBatch[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [countdown, setCountdown] = useState(30);
  const [streaming, setStreaming] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const transcriptText = transcript.map((e) => e.text).join("\n");

  // --- Transcription ---
  const apiKeyRef = useRef(settings.apiKey);
  useEffect(() => { apiKeyRef.current = settings.apiKey; }, [settings.apiKey]);

  const handleAudioChunk = useCallback(
    async (blob: Blob) => {
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
    },
    []
  );

  const { recording, startRecording, stopRecording } = useAudioRecorder(
    handleAudioChunk,
    settings.refreshInterval * 1000
  );

  // --- Suggestions ---
  const fetchSuggestions = useCallback(
    async (currentTranscript: string) => {
      if (!settings.apiKey || !currentTranscript.trim() || loadingSuggestions)
        return;
      setLoadingSuggestions(true);
      try {
        const context = currentTranscript.slice(
          -settings.suggestionContextWindow
        );
        const prompt = settings.suggestionPrompt.replace(
          "{transcript}",
          context
        );
        const res = await fetch("/api/suggest", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": settings.apiKey,
          },
          body: JSON.stringify({ prompt }),
        });
        const data = await res.json();
        if (data.suggestions?.length > 0) {
          setBatches((prev) => [
            {
              id: crypto.randomUUID(),
              timestamp: ts(),
              suggestions: data.suggestions,
            },
            ...prev,
          ]);
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
    ]
  );

  // Auto-refresh countdown
  useEffect(() => {
    if (!recording) {
      setCountdown(settings.refreshInterval);
      return;
    }
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
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [recording]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch suggestions when transcript changes
  const prevLengthRef = useRef(0);
  useEffect(() => {
    if (transcript.length > prevLengthRef.current && transcript.length > 0) {
      const timer = setTimeout(() => {
        fetchSuggestions(transcriptText);
      }, 2000);
      prevLengthRef.current = transcript.length;
      return () => clearTimeout(timer);
    }
    prevLengthRef.current = transcript.length;
  }, [transcript.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleReload = () => {
    setCountdown(settings.refreshInterval);
    fetchSuggestions(transcriptText);
  };

  // --- Chat (shared streaming helper) ---
  const streamResponse = async (prompt: string, assistantId: string) => {
    setStreaming(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": settings.apiKey,
        },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok || !res.body) throw new Error("Chat request failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: fullText } : m
          )
        );
      }
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
      setStreaming(false);
    }
  };

  const handleSuggestionClick = async (
    batch: SuggestionBatch,
    index: number
  ) => {
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

    const context = transcriptText.slice(-settings.detailContextWindow);
    const prompt = settings.detailPrompt
      .replace("{suggestion_preview}", suggestion.preview)
      .replace("{suggestion_type}", suggestion.type)
      .replace("{transcript}", context);

    await streamResponse(prompt, assistantId);
  };

  const handleChatSend = async (message: string) => {
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

    const chatHistory = messages
      .map(
        (m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`
      )
      .join("\n");
    const context = transcriptText.slice(-settings.detailContextWindow);
    const prompt = settings.chatPrompt
      .replace("{transcript}", context)
      .replace("{chat_history}", chatHistory)
      .replace("{message}", message);

    await streamResponse(prompt, assistantId);
  };

  // --- Settings ---
  const handleSaveSettings = (newSettings: Settings) => {
    setSettings(newSettings);
    localStorage.setItem("twinmind-settings", JSON.stringify(newSettings));
  };

  return (
    <>
      <div className="topbar">
        <h1>TwinMind — Live Suggestions</h1>
        <div className="topbar-actions">
          <ExportButton
            transcript={transcript}
            batches={batches}
            messages={messages}
          />
          <button
            className="settings-btn"
            onClick={() => setShowSettings(true)}
          >
            ⚙ Settings
          </button>
        </div>
      </div>

      <div className="layout">
        <TranscriptPanel
          entries={transcript}
          recording={recording}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
        />
        <SuggestionsPanel
          batches={batches}
          countdown={countdown}
          onReload={handleReload}
          onSuggestionClick={handleSuggestionClick}
        />
        <ChatPanel
          messages={messages}
          onSend={handleChatSend}
          streaming={streaming}
        />
      </div>

      {showSettings && (
        <SettingsModal
          settings={settings}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </>
  );
}
