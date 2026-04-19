import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import ExportButton from "@/components/ExportButton";
import { TranscriptEntry, SuggestionBatch, ChatMessage } from "@/lib/types";

describe("ExportButton", () => {
  const transcript: TranscriptEntry[] = [
    { timestamp: "12:00:00", text: "Hello world" },
  ];
  const batches: SuggestionBatch[] = [
    {
      id: "batch-1",
      timestamp: "12:00:10",
      suggestions: [
        { id: "s1", type: "QUESTION", preview: "Ask this?", detail_prompt: "more" },
      ],
    },
  ];
  const messages: ChatMessage[] = [
    { id: "m1", role: "user", content: "Hi", timestamp: "12:00:05" },
    { id: "m2", role: "assistant", content: "Hello!", timestamp: "12:00:06" },
  ];

  it("renders the export button", () => {
    render(
      <ExportButton transcript={transcript} batches={batches} messages={messages} />
    );
    expect(screen.getByText("↓ Export Session")).toBeInTheDocument();
  });

  it("creates a downloadable blob on click", () => {
    const createUrlSpy = jest.fn(() => "blob:mock");
    const revokeSpy = jest.fn();
    (globalThis as any).URL.createObjectURL = createUrlSpy;
    (globalThis as any).URL.revokeObjectURL = revokeSpy;

    render(
      <ExportButton transcript={transcript} batches={batches} messages={messages} />
    );

    const btn = screen.getByText("↓ Export Session");
    btn.click();

    expect(createUrlSpy).toHaveBeenCalled();
    const blob = createUrlSpy.mock.calls[0][0] as Blob;
    expect(blob.type).toBe("application/json");
  });
});
