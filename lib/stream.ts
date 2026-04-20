export async function streamChatResponse(
  apiKey: string,
  messages: Array<{ role: string; content: string }>,
  onChunk: (fullText: string) => void
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120000);

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({ messages }),
      signal: controller.signal,
    });

    if (!res.ok || !res.body) {
      const errText = await res.text().catch(() => "");
      throw new Error(
        `Chat request failed: ${res.status} ${errText}`
      );
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      fullText += decoder.decode(value, { stream: true });
      onChunk(fullText);
    }

    return fullText;
  } finally {
    clearTimeout(timeout);
  }
}
