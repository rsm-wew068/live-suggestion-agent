import { NextRequest, NextResponse } from "next/server";
import { getSuggestions } from "@/lib/groq";

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey) {
    return NextResponse.json({ error: "API key required" }, { status: 400 });
  }

  try {
    const { systemPrompt, userPrompt } = await req.json();
    if (!userPrompt || typeof userPrompt !== "string") {
      return NextResponse.json(
        { error: "userPrompt required" },
        { status: 400 }
      );
    }

    const raw = await getSuggestions(
      apiKey,
      systemPrompt || "",
      userPrompt
    );

    let suggestions;
    try {
      const parsed = JSON.parse(raw);
      suggestions = Array.isArray(parsed) ? parsed : parsed.suggestions || [];
    } catch {
      suggestions = [];
    }

    const valid = suggestions
      .filter(
        (s: Record<string, unknown>) =>
          s.type && s.preview && typeof s.preview === "string"
      )
      .slice(0, 3)
      .map((s: Record<string, unknown>) => ({
        id: crypto.randomUUID(),
        type: s.type,
        preview: s.preview,
        detail_prompt: s.detail_prompt || s.preview,
      }));

    return NextResponse.json({ suggestions: valid });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
