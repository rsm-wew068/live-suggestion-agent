"use client";

import { Suggestion } from "@/lib/types";

const TYPE_LABELS: Record<string, string> = {
  QUESTION: "Question to ask",
  TALKING_POINT: "Talking point",
  ANSWER: "Answer",
  FACT_CHECK: "Fact-check",
  CLARIFICATION: "Clarification",
};

const TYPE_CLASSES: Record<string, string> = {
  QUESTION: "question",
  TALKING_POINT: "talking",
  ANSWER: "answer",
  FACT_CHECK: "fact",
  CLARIFICATION: "question",
};

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
