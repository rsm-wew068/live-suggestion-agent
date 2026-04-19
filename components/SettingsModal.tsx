"use client";

import { useState } from "react";
import { Settings, DEFAULT_SETTINGS } from "@/lib/types";

interface SettingsModalProps {
  settings: Settings;
  onSave: (settings: Settings) => void;
  onClose: () => void;
}

export default function SettingsModal({
  settings,
  onSave,
  onClose,
}: SettingsModalProps) {
  const [form, setForm] = useState<Settings>({ ...settings });

  const handleChange = (
    field: keyof Settings,
    value: string | number
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave(form);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Settings</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body">
          <label>
            <span className="label-text">Groq API Key</span>
            <input
              type="password"
              value={form.apiKey}
              onChange={(e) => handleChange("apiKey", e.target.value)}
              placeholder="gsk_..."
              className="settings-input"
            />
          </label>

          <label>
            <span className="label-text">
              Suggestion Prompt
              <button
                className="reset-btn"
                onClick={() =>
                  handleChange(
                    "suggestionPrompt",
                    DEFAULT_SETTINGS.suggestionPrompt
                  )
                }
              >
                Reset
              </button>
            </span>
            <textarea
              value={form.suggestionPrompt}
              onChange={(e) => handleChange("suggestionPrompt", e.target.value)}
              rows={6}
              className="settings-textarea"
            />
          </label>

          <label>
            <span className="label-text">
              Detail Answer Prompt
              <button
                className="reset-btn"
                onClick={() =>
                  handleChange(
                    "detailPrompt",
                    DEFAULT_SETTINGS.detailPrompt
                  )
                }
              >
                Reset
              </button>
            </span>
            <textarea
              value={form.detailPrompt}
              onChange={(e) => handleChange("detailPrompt", e.target.value)}
              rows={6}
              className="settings-textarea"
            />
          </label>

          <label>
            <span className="label-text">
              Chat Prompt
              <button
                className="reset-btn"
                onClick={() =>
                  handleChange("chatPrompt", DEFAULT_SETTINGS.chatPrompt)
                }
              >
                Reset
              </button>
            </span>
            <textarea
              value={form.chatPrompt}
              onChange={(e) => handleChange("chatPrompt", e.target.value)}
              rows={6}
              className="settings-textarea"
            />
          </label>

          <div className="settings-row">
            <label>
              <span className="label-text">Suggestion Context Window (chars)</span>
              <input
                type="number"
                value={form.suggestionContextWindow}
                onChange={(e) =>
                  handleChange("suggestionContextWindow", parseInt(e.target.value) || 3000)
                }
                className="settings-input small"
              />
            </label>
            <label>
              <span className="label-text">Detail Context Window (chars)</span>
              <input
                type="number"
                value={form.detailContextWindow}
                onChange={(e) =>
                  handleChange("detailContextWindow", parseInt(e.target.value) || 8000)
                }
                className="settings-input small"
              />
            </label>
            <label>
              <span className="label-text">Refresh Interval (seconds)</span>
              <input
                type="number"
                value={form.refreshInterval}
                onChange={(e) =>
                  handleChange("refreshInterval", parseInt(e.target.value) || 30)
                }
                className="settings-input small"
              />
            </label>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleSave}>
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
