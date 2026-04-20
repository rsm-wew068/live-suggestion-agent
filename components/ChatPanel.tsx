"use client";

import { useRef, useEffect, useState } from "react";
import ChatMarkdown from "react-markdown";
import { ChatMessage } from "@/lib/types";
import { TYPE_LABELS } from "@/lib/constants";

interface ChatPanelProps {
  messages: ChatMessage[];
  onSend: (message: string) => void;
  streaming: boolean;
}

export default function ChatPanel({
  messages,
  onSend,
  streaming,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || streaming) return;
    onSend(trimmed);
    setInput("");
  };

  return (
    <div className="col">
      <header className="col-header">
        <span>3. Chat (detailed answers)</span>
        <span className="muted">session-only</span>
      </header>
      <div className="body" ref={bodyRef}>
        {messages.length === 0 && (
          <div className="empty">
            Click a suggestion or type a question below.
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`chat-msg ${msg.role}`}>
            <div className="who">
              {msg.role === "user"
                ? msg.suggestionLabel
                  ? `You · ${msg.suggestionLabel}`
                  : "You"
                : "Assistant"}
            </div>
            <div className="bubble">
              {msg.role === "assistant" && msg.content ? (
                <ChatMarkdown>{msg.content}</ChatMarkdown>
              ) : (
                msg.content
              )}
              {streaming &&
                msg === messages[messages.length - 1] &&
                msg.role === "assistant" && (
                  <span className="cursor-blink">▊</span>
                )}
            </div>
          </div>
        ))}
      </div>
      <div className="chat-input-row">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask anything…"
          disabled={streaming}
        />
        <button onClick={handleSend} disabled={streaming || !input.trim()}>
          Send
        </button>
      </div>
    </div>
  );
}
