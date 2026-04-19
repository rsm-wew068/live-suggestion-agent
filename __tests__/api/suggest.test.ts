import * as groq from "@/lib/groq";

jest.mock("@/lib/groq");

const mockGetSuggestions = groq.getSuggestions as jest.MockedFunction<
  typeof groq.getSuggestions
>;

function parseSuggestions(raw: string) {
  let suggestions;
  try {
    const parsed = JSON.parse(raw);
    suggestions = Array.isArray(parsed) ? parsed : parsed.suggestions || [];
  } catch {
    suggestions = [];
  }

  return suggestions
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
}

describe("Suggestion parsing logic", () => {
  beforeEach(() => jest.clearAllMocks());

  it("parses valid suggestions from object wrapper", () => {
    const raw = JSON.stringify({
      suggestions: [
        { type: "QUESTION", preview: "Ask this?", detail_prompt: "more" },
        { type: "FACT_CHECK", preview: "Check this", detail_prompt: "detail" },
        { type: "ANSWER", preview: "The answer", detail_prompt: "explain" },
      ],
    });

    const result = parseSuggestions(raw);
    expect(result).toHaveLength(3);
    expect(result[0]).toMatchObject({ type: "QUESTION", preview: "Ask this?" });
  });

  it("parses valid suggestions from array", () => {
    const raw = JSON.stringify([
      { type: "QUESTION", preview: "Ask?", detail_prompt: "more" },
    ]);
    const result = parseSuggestions(raw);
    expect(result).toHaveLength(1);
  });

  it("filters invalid suggestions (missing type or preview)", () => {
    const raw = JSON.stringify([
      { type: "QUESTION", preview: "Valid", detail_prompt: "more" },
      { type: "BAD_TYPE" },
      { preview: "No type" },
    ]);
    const result = parseSuggestions(raw);
    expect(result).toHaveLength(1);
    expect(result[0].preview).toBe("Valid");
  });

  it("caps at 3 suggestions", () => {
    const many = Array.from({ length: 6 }, (_, i) => ({
      type: "QUESTION",
      preview: `Sug ${i}`,
      detail_prompt: `d ${i}`,
    }));
    const result = parseSuggestions(JSON.stringify(many));
    expect(result).toHaveLength(3);
  });

  it("returns empty array for malformed JSON", () => {
    const result = parseSuggestions("not json");
    expect(result).toEqual([]);
  });

  it("assigns UUID to each suggestion", () => {
    const raw = JSON.stringify([
      { type: "QUESTION", preview: "Q1", detail_prompt: "d1" },
    ]);
    const result = parseSuggestions(raw);
    expect(result[0].id).toBeTruthy();
    expect(typeof result[0].id).toBe("string");
  });
});
