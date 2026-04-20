const GROQ_API_URL = "https://api.groq.com/openai/v1";
const TRANSCRIPTION_MODEL = "whisper-large-v3";
const CHAT_MODEL = "openai/gpt-oss-120b";

export async function transcribeAudio(
  apiKey: string,
  audioBlob: Blob
): Promise<string> {
  const formData = new FormData();
  formData.append("file", audioBlob, "audio.webm");
  formData.append("model", TRANSCRIPTION_MODEL);
  formData.append("response_format", "json");
  formData.append("language", "en");

  const res = await fetch(`${GROQ_API_URL}/audio/transcriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Transcription failed: ${res.status} ${err}`);
  }

  const data = await res.json();
  return data.text || "";
}

export async function getSuggestions(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const res = await fetch(`${GROQ_API_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: CHAT_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1024,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Suggestions failed: ${res.status} ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "[]";
}

export async function streamChat(
  apiKey: string,
  messages: Array<{ role: string; content: string }>
): Promise<ReadableStream<Uint8Array>> {
  const res = await fetch(`${GROQ_API_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: CHAT_MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 2048,
      stream: true,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Chat failed: ${res.status} ${err}`);
  }

  if (!res.body) throw new Error("No response body");

  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  const reader = res.body.getReader();

  // Process SSE eagerly and pipe content bytes
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data: ")) continue;
            const data = trimmed.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                controller.enqueue(encoder.encode(content));
              }
            } catch {
              // skip malformed JSON
            }
          }
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
    cancel() {
      reader.cancel();
    },
  });
}
