import * as groq from "@/lib/groq";

jest.mock("@/lib/groq");

const mockStreamChat = groq.streamChat as jest.MockedFunction<
  typeof groq.streamChat
>;

describe("Chat streaming logic", () => {
  beforeEach(() => jest.clearAllMocks());

  it("calls streamChat with correct parameters", async () => {
    const mockStream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("Hello"));
        controller.close();
      },
    });
    mockStreamChat.mockResolvedValueOnce(mockStream);

    const result = await mockStreamChat("key", "test prompt");
    expect(mockStreamChat).toHaveBeenCalledWith("key", "test prompt");
    expect(result).toBeInstanceOf(ReadableStream);
  });

  it("decodes stream content correctly", async () => {
    const encoder = new TextEncoder();
    const mockStream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode("Hello "));
        controller.enqueue(encoder.encode("world"));
        controller.close();
      },
    });
    mockStreamChat.mockResolvedValueOnce(mockStream);

    const stream = await mockStreamChat("key", "prompt");
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    const chunks: string[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(decoder.decode(value));
    }

    expect(chunks).toEqual(["Hello ", "world"]);
  });

  it("propagates errors", async () => {
    mockStreamChat.mockRejectedValueOnce(new Error("Stream failed"));
    await expect(mockStreamChat("key", "prompt")).rejects.toThrow(
      "Stream failed"
    );
  });
});
