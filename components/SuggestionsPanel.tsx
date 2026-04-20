"use client";

import { SuggestionBatch } from "@/lib/types";
import SuggestionCard from "./SuggestionCard";

interface SuggestionsPanelProps {
  batches: SuggestionBatch[];
  countdown: number;
  loading?: boolean;
  onReload: () => void;
  onSuggestionClick: (batch: SuggestionBatch, index: number) => void;
}

export default function SuggestionsPanel({
  batches,
  countdown,
  loading,
  onReload,
  onSuggestionClick,
}: SuggestionsPanelProps) {
  return (
    <div className="col">
      <header className="col-header">
        <span>2. Live Suggestions</span>
        <span className="muted">
          {batches.length} batch{batches.length !== 1 ? "es" : ""}
        </span>
      </header>
      <div className="reload-row">
        <button className="reload-btn" onClick={onReload} disabled={loading}>
          <span className={loading ? "spin" : ""}>↻</span>{" "}
          {loading ? "Loading…" : "Reload suggestions"}
        </button>
        <span className="countdown">auto-refresh in {countdown}s</span>
      </div>
      <div className="body">
        {batches.length === 0 && (
          <div className="empty">
            Suggestions appear here once recording starts.
          </div>
        )}
        {batches.map((batch, batchIndex) => (
          <div key={batch.id}>
            {batch.suggestions.map((suggestion, sugIndex) => (
              <SuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                fresh={batchIndex === 0}
                onClick={() => onSuggestionClick(batch, sugIndex)}
              />
            ))}
            <div className="sug-batch-divider">
              — Batch {batches.length - batchIndex} · {batch.timestamp} —
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
