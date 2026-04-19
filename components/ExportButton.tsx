"use client";

import {
  TranscriptEntry,
  SuggestionBatch,
  ChatMessage,
} from "@/lib/types";

interface ExportButtonProps {
  transcript: TranscriptEntry[];
  batches: SuggestionBatch[];
  messages: ChatMessage[];
}

export default function ExportButton({
  transcript,
  batches,
  messages,
}: ExportButtonProps) {
  const handleExport = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      transcript,
      suggestionBatches: batches,
      chatMessages: messages,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `twinmind-session-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button className="export-btn" onClick={handleExport}>
      ↓ Export Session
    </button>
  );
}
