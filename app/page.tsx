"use client";

import { useEffect, useState } from "react";
import { Settings } from "@/lib/types";
import { DEFAULT_SETTINGS } from "@/lib/prompts";
import { useTranscription } from "@/hooks/useTranscript";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { useSuggestions } from "@/hooks/useSuggestions";
import { useChat } from "@/hooks/useChat";
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

export default function Home() {
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [showSettings, setShowSettings] = useState(false);

  const { transcript, handleAudioChunk } = useTranscription(settings.apiKey);
  const { recording, startRecording, stopRecording } = useAudioRecorder(
    handleAudioChunk,
    settings.refreshInterval * 1000
  );

  const {
    batches,
    loadingSuggestions,
    countdown,
    handleReload,
    startCountdown,
    stopCountdown,
    onTranscriptChange,
  } = useSuggestions(transcript, settings, recording);

  const { messages, streaming, handleSuggestionClick, handleChatSend } =
    useChat(transcript, settings);

  // Auto-refresh countdown lifecycle
  useEffect(() => {
    if (recording) {
      startCountdown();
    } else {
      stopCountdown();
    }
    return () => stopCountdown();
  }, [recording, startCountdown, stopCountdown]);

  // Fetch suggestions when transcript changes
  useEffect(() => {
    return onTranscriptChange();
  }, [transcript.length, onTranscriptChange]); // eslint-disable-line react-hooks/exhaustive-deps

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
          loading={loadingSuggestions}
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
