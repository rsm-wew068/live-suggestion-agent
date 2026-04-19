import * as groq from "@/lib/groq";

jest.mock("@/lib/groq");

const mockTranscribe = groq.transcribeAudio as jest.MockedFunction<
  typeof groq.transcribeAudio
>;

describe("POST /api/transcribe", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns transcript text on success", async () => {
    mockTranscribe.mockResolvedValueOnce("Hello world");

    const result = await mockTranscribe("key", new Blob(["audio"]));
    expect(result).toBe("Hello world");
    expect(mockTranscribe).toHaveBeenCalledWith("key", expect.any(Blob));
  });

  it("passes correct API key and audio blob", async () => {
    mockTranscribe.mockResolvedValueOnce("test");

    const blob = new Blob(["audio-data"], { type: "audio/webm" });
    await mockTranscribe("my-api-key", blob);

    expect(mockTranscribe).toHaveBeenCalledWith("my-api-key", blob);
  });

  it("propagates errors from Groq API", async () => {
    mockTranscribe.mockRejectedValueOnce(new Error("API failure"));

    await expect(mockTranscribe("key", new Blob())).rejects.toThrow(
      "API failure"
    );
  });

  it("handles empty transcription result", async () => {
    mockTranscribe.mockResolvedValueOnce("");

    const result = await mockTranscribe("key", new Blob());
    expect(result).toBe("");
  });
});
