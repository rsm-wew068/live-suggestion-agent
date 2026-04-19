# TwinMind — Live Suggestions

A web app that listens to live audio from the user's mic and continuously surfaces 3 useful AI-powered suggestions based on what is being said. Clicking a suggestion opens a detailed answer in a chat panel.

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:3000. Click the **Settings** gear icon, paste your Groq API key, and you're ready.

## Stack Choices

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Next.js 15 (App Router) | Server API routes + client UI in one deploy unit |
| Styling | Custom CSS (no Tailwind utility classes) | Exact match to the reference prototype's design tokens |
| Transcription | Groq Whisper Large V3 | Required — ultra-fast speech-to-text |
| Suggestions/Chat | Groq GPT-OSS 120B | Required — fast LLM inference for real-time suggestions |
| Audio Capture | MediaRecorder API | Browser-native, no dependencies |
| Deployment | Vercel | Free tier, zero-config for Next.js |

## Architecture

```
app/
  page.tsx              # Main orchestrator — all state management
  layout.tsx            # Root layout
  globals.css           # All styles matching prototype design tokens
  api/
    transcribe/route.ts # Audio → text via Groq Whisper
    suggest/route.ts    # Transcript → 3 suggestions via GPT-OSS
    chat/route.ts       # Question/suggestion → streaming answer via GPT-OSS
components/
  TranscriptPanel.tsx   # Left column: mic button + scrolling transcript
  SuggestionsPanel.tsx  # Middle column: reload + suggestion batches
  SuggestionCard.tsx    # Individual suggestion card with type tag
  ChatPanel.tsx         # Right column: chat messages + input
  SettingsModal.tsx     # API key + editable prompt settings
  ExportButton.tsx      # Export full session as JSON
lib/
  groq.ts               # Groq API client (transcribe, suggest, stream chat)
  prompts.ts            # Prompt builder functions
  types.ts              # TypeScript types + default settings
hooks/
  useAudioRecorder.ts   # MediaRecorder hook with configurable chunk interval
```

## Data Flow

1. **Mic captures audio** → MediaRecorder chunks every 30s
2. **Chunk → `/api/transcribe`** → Groq Whisper returns text
3. **Transcript text → `/api/suggest`** → GPT-OSS returns 3 typed suggestions
4. **Suggestion click or typed question → `/api/chat`** → GPT-OSS streams detailed answer
5. **30s countdown** auto-triggers suggestion refresh while recording

## Prompt Strategy

### Suggestion Generation
The suggestion prompt is the core differentiator. It instructs the model to:
- **Analyze conversation flow** — not just keywords
- **Vary suggestion types** contextually: QUESTION, TALKING_POINT, ANSWER, FACT_CHECK, CLARIFICATION
- **Be specific** to what was actually said — no generic filler
- **Return structured JSON** for reliable parsing

The preview alone must deliver value. The `detail_prompt` field gives the model a focused instruction for the expanded answer.

### Context Windowing
- **Suggestions**: Last 3,000 characters of transcript (recent context, avoids stale info)
- **Detail answers**: Last 8,000 characters (more context for thorough responses)
- Both configurable in Settings

### Tradeoffs

| Decision | Tradeoff |
|----------|----------|
| `response_format: json_object` for suggestions | More reliable parsing vs. slightly constrained output. Worth it for structured data |
| Client-side state (no persistence) | Simpler, matches "session-only" requirement. Lost on reload is acceptable |
| Streaming chat responses | Better UX (tokens appear immediately) vs. more complex code. Groq's speed makes this very responsive |
| 2s debounce after transcript arrives | Avoids duplicate suggestion requests while still feeling real-time |
| No Tailwind utility classes | Exact prototype match was easier with custom CSS. Less abstraction overhead for a single-page app |

## Settings

All prompts and parameters are editable in the Settings modal:
- Groq API key (stored in localStorage)
- Suggestion prompt, detail answer prompt, chat prompt
- Context window sizes (characters)
- Refresh interval (seconds)

## Export

The Export button downloads a JSON file containing:
- Full transcript with timestamps
- All suggestion batches with timestamps
- Complete chat history with timestamps

## Deployment

```bash
npx vercel
```

Or connect your GitHub repo to Vercel for automatic deploys.

## Scripts

```bash
npm run dev       # Start development server
npm run build     # Production build
npm run start     # Start production server
npm run lint      # Run ESLint
```
