"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import { ChatMessage } from "@/lib/types";
import { TYPE_LABELS } from "@/lib/constants";

function renderMarkdown(text: string): string {
  return text
    // Escape HTML
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // Code blocks (```...```)
    .replace(/```(\w*)\n?([\s\S]*?)```/g, "<pre><code>$2</code></pre>")
    // Inline code
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    // Bold
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // Italic
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Headers
    .replace(/^### (.+)$/gm, "<h4>$1</h4>")
    .replace(/^## (.+)$/gm, "<h3>$1</h3>")
    .replace(/^# (.+)$/gm, "<h3>$1</h3>")
    // Unordered lists
    .replace(/^[-*] (.+)$/gm, "<li>$1</li>")
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
    // Paragraphs — double newline
    .replace(/\n\n/g, "</p><p>")
    // Single newline within paragraph
    .replace(/\n/g, "<br/>")
    // Wrap in paragraph
    .replace(/^(.+)$/, "<p>$1</p>");
}

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
            <div
              className="bubble"
              {...(msg.role === "assistant" && msg.content
                ? { dangerouslySetInnerHTML: { __html: renderMarkdown(msg.content) + (streaming && msg === messages[messages.length - 1] ? '<span class="cursor-blink">▊</span>' : '') } }
                : {})}
            >
              {msg.role === "user" || !msg.content ? msg.content : null}
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
