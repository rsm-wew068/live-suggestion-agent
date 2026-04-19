"use client";

import { useEffect, useRef } from "react";
import { TranscriptEntry } from "@/lib/types";

interface TranscriptPanelProps {
  entries: TranscriptEntry[];
  recording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
}

export default function TranscriptPanel({
  entries,
  recording,
  onStartRecording,
  onStopRecording,
}: TranscriptPanelProps) {
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [entries]);

  return (
    <div className="col">
      <header className="col-header">
        <span>1. Mic &amp; Transcript</span>
        <span className="muted">
          {recording ? (
            <span style={{ color: "var(--danger)" }}>recording</span>
          ) : (
            "idle"
          )}
        </span>
      </header>
      <div className="mic-wrap">
        <button
          className={`mic-btn ${recording ? "recording" : ""}`}
          onClick={recording ? onStopRecording : onStartRecording}
          title={recording ? "Stop recording" : "Start recording"}
        >
          ●
        </button>
        <div className="mic-status">
          {recording
            ? "Listening… transcript updates every ~30s."
            : "Click mic to start. Transcript appends every ~30s."}
        </div>
      </div>
      <div className="body" ref={bodyRef}>
        {entries.length === 0 && (
          <div className="empty">No transcript yet — start the mic.</div>
        )}
        {entries.map((entry, i) => (
          <div
            key={i}
            className={`transcript-line ${i === entries.length - 1 ? "new" : ""}`}
          >
            <span className="ts">{entry.timestamp}</span>
            {entry.text}
          </div>
        ))}
      </div>
    </div>
  );
}
