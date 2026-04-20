"use client";

import { Suggestion } from "@/lib/types";
import { TYPE_LABELS, TYPE_CLASSES } from "@/lib/constants";

interface SuggestionCardProps {
  suggestion: Suggestion;
  fresh: boolean;
  onClick: (suggestion: Suggestion) => void;
}

export default function SuggestionCard({
  suggestion,
  fresh,
  onClick,
}: SuggestionCardProps) {
  return (
    <div
      className={`suggestion ${fresh ? "fresh" : "stale"}`}
      onClick={() => onClick(suggestion)}
    >
      <span className={`sug-tag ${TYPE_CLASSES[suggestion.type] || "question"}`}>
        {TYPE_LABELS[suggestion.type] || suggestion.type}
      </span>
      <div className="sug-title">{suggestion.preview}</div>
    </div>
  );
}
