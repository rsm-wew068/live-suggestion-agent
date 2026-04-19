import { transcribeAudio, getSuggestions, streamChat } from "@/lib/groq";

const mockFetch = jest.fn();
globalThis.fetch = mockFetch;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("transcribeAudio", () => {
  it("sends audio to Groq Whisper and returns transcript text", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ text: "hello world" }),
    });

    const blob = new Blob(["audio"], { type: "audio/webm" });
    const result = await transcribeAudio("test-key", blob);

    expect(result).toBe("hello world");
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.groq.com/openai/v1/audio/transcriptions",
      expect.objectContaining({
        method: "POST",
        headers: { Authorization: "Bearer test-key" },
      })
    );
  });

  it("throws on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => "Unauthorized",
    });

    await expect(
      transcribeAudio("bad-key", new Blob())
    ).rejects.toThrow("Transcription failed: 401");
  });
});

describe("getSuggestions", () => {
  it("sends prompt and returns raw response string", async () => {
    const suggestions = [
      { type: "QUESTION", preview: "Ask this", detail_prompt: "more" },
    ];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify(suggestions) } }],
      }),
    });

    const result = await getSuggestions("key", "test prompt");

    expect(result).toBe(JSON.stringify(suggestions));
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.groq.com/openai/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer key",
          "Content-Type": "application/json",
        }),
      })
    );
  });

  it("includes response_format in request body", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "[]" } }],
      }),
    });

    await getSuggestions("key", "prompt");

    const call = mockFetch.mock.calls[0];
    const body = JSON.parse(call![1]!.body as string);
    expect(body.response_format).toEqual({ type: "json_object" });
    expect(body.model).toBe("openai/gpt-oss-120b");
  });

  it("throws on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      text: async () => "Rate limited",
    });

    await expect(getSuggestions("key", "prompt")).rejects.toThrow(
      "Suggestions failed: 429"
    );
  });
});

describe("streamChat", () => {
  it("returns a ReadableStream with decoded SSE content", async () => {
    const encoder = new TextEncoder();
    const sseChunks = [
      encoder.encode('data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n'),
      encoder.encode('data: {"choices":[{"delta":{"content":" world"}}]}\n\n'),
      encoder.encode("data: [DONE]\n\n"),
    ];

    const mockStream = new ReadableStream({
      start(controller) {
        sseChunks.forEach((chunk) => controller.enqueue(chunk));
        controller.close();
      },
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      body: mockStream,
    });

    const stream = await streamChat("key", "prompt");
    const reader = stream.getReader();
    const chunks: string[] = [];
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(decoder.decode(value));
    }

    expect(chunks).toEqual(["Hello", " world"]);
  });

  it("throws on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => "Server error",
    });

    await expect(streamChat("key", "prompt")).rejects.toThrow(
      "Chat failed: 500"
    );
  });

  it("throws when no response body", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      body: null,
    });

    await expect(streamChat("key", "prompt")).rejects.toThrow(
      "No response body"
    );
  });

  it("includes stream: true in request body", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      body: new ReadableStream({
        start(c) { c.close(); },
      }),
    });

    await streamChat("key", "prompt");

    const call = mockFetch.mock.calls[0];
    const body = JSON.parse(call![1]!.body as string);
    expect(body.stream).toBe(true);
    expect(body.model).toBe("openai/gpt-oss-120b");
  });
});
