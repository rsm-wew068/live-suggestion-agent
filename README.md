# Live Suggestion Agent

[![Try Live](https://img.shields.io/badge/🚀_Try_Live_Suggestion_Agent-06b6d4?style=for-the-badge&logo=google-cloud&logoColor=white)](https://twinmind-live-suggestion-liart.vercel.app)

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
| Framework | Next.js 16 (App Router) | Server API routes + client UI in one deploy unit |
| Styling | Custom CSS (no Tailwind utility classes) | Exact match to the reference prototype's design tokens |
| Transcription | Groq Whisper Large V3 | Required — ultra-fast speech-to-text |
| Suggestions/Chat | Groq GPT-OSS 120B | Required — fast LLM inference for real-time suggestions |
| Markdown | react-markdown | Proper rendering of AI responses (tables, code, lists) |
| Audio Capture | MediaRecorder API | Browser-native, no dependencies |
| Deployment | Vercel | Free tier, zero-config for Next.js |

## Architecture

```
app/
  page.tsx              # Shell — wiring, layout, settings modal
  layout.tsx            # Root layout
  globals.css           # All styles matching prototype design tokens
  api/
    transcribe/route.ts # Audio → text via Groq Whisper
    suggest/route.ts    # Transcript → 3 suggestions via GPT-OSS
    chat/route.ts       # Structured messages → streaming answer via GPT-OSS
components/
  TranscriptPanel.tsx   # Left column: mic button + scrolling transcript
  SuggestionsPanel.tsx  # Middle column: reload + suggestion batches
  SuggestionCard.tsx    # Individual suggestion card with type tag
  ChatPanel.tsx         # Right column: chat messages + input
  SettingsModal.tsx     # API key + editable prompt settings
  ExportButton.tsx      # Export full session as JSON
lib/
  groq.ts               # Groq API client (transcribe, suggest, stream chat)
  constants.ts          # Shared TYPE_LABELS / TYPE_CLASSES
  stream.ts             # Client-side streaming fetch utility
  types.ts              # TypeScript interfaces
  prompts.ts             # All prompt templates + DEFAULT_SETTINGS (single source of truth)
hooks/
  useTranscript.ts      # Transcription state + formatTranscript helper
  useAudioRecorder.ts   # MediaRecorder hook with configurable chunk interval
  useSuggestions.ts     # Suggestion batches, auto-refresh countdown, dedup
  useChat.ts            # Chat messages, streaming state, suggestion click handler
```

## Data Flow

1. **Mic captures audio** → MediaRecorder stop/start cycle every 30s
2. **Chunk → `/api/transcribe`** → Groq Whisper returns text
3. **Structured transcript → `/api/suggest`** → GPT-OSS returns 3 typed suggestions
4. **Suggestion click or typed question → `/api/chat`** → GPT-OSS streams detailed answer
5. **30s countdown** auto-triggers suggestion refresh while recording
6. **Transcript change** triggers suggestion refresh after 2s debounce

## Prompt Strategy

### System / User Message Separation
All Groq API calls use separate `system` and `user` messages rather than cramming everything into a single user turn. This gives the model a stable persona anchor and cleaner instruction-following.

### Structured Transcript Context
Transcript is passed with timestamps preserved (`[14:32:05] Speaker text here`) instead of flat text. This gives the model temporal awareness — it can detect topic shifts and recency.

### Suggestion Generation
The suggestion prompt is the core differentiator. It instructs the model to:
- **Classify conversation state** first: QUESTION_ASKED, CLAIM_MADE, DISCUSSION_ACTIVE, DISCUSSION_STALLING, or TOPIC_SHIFT
- **Vary suggestion types** based on that state: QUESTION, TALKING_POINT, ANSWER, FACT_CHECK, CLARIFICATION
- **Be specific** to what was actually said — no generic filler
- **Avoid repetition** — previous suggestions are injected into the prompt
- **Return structured JSON** (`{"suggestions": [...]}`) matching `response_format: json_object`

The preview alone must deliver value. The `detail_prompt` field from each suggestion is passed to the detail answer prompt to guide the expanded response.

### Deduplication
Two layers prevent repetitive suggestions:
1. **Prompt-level**: Previous suggestions are listed in the prompt with "avoid repeating" instruction
2. **Client-level**: New suggestions with >70% word overlap against the last 2 batches are filtered out

### Chat History
Chat messages are sent as a structured `system`/`user`/`assistant` message array to the Groq API, not as flat serialized text. This lets the model natively understand multi-turn conversation context.

### Context Windowing
- **Suggestions**: Last 3,000 characters of formatted transcript (recent context, avoids stale info)
- **Detail answers / chat**: Last 8,000 characters (more context for thorough responses)
- Both configurable in Settings

### Tradeoffs

| Decision | Tradeoff |
|----------|----------|
| `response_format: json_object` for suggestions | More reliable parsing vs. slightly constrained output. Worth it for structured data |
| Client-side state (no persistence) | Simpler, matches "session-only" requirement. Lost on reload is acceptable |
| Streaming chat responses | Better UX (tokens appear immediately) vs. more complex code. Groq's speed makes this very responsive |
| 2s debounce after transcript arrives | Avoids duplicate suggestion requests while still feeling real-time |
| No Tailwind utility classes | Exact prototype match was easier with custom CSS. Less abstraction overhead for a single-page app |
| Conversation state classification in prompt | Adds one inference step but produces much more contextually appropriate suggestion mixes |
| Jaccard word-overlap dedup (0.7 threshold) | Simple, fast, no extra API call. May occasionally filter a valid rephrasing |

## Settings

All prompts and parameters are editable in the Settings modal:
- Groq API key (stored in localStorage)
- Suggestion prompt (supports `{transcript}`, `{previous_suggestions}` placeholders)
- Detail answer prompt (supports `{suggestion_preview}`, `{suggestion_type}`, `{transcript}`)
- Context window sizes (characters)
- Refresh interval (seconds)

## Export

The Export button downloads a JSON file containing:
- Full transcript with timestamps
- All suggestion batches with timestamps
- Complete chat history with timestamps

## Tests

```bash
npm test    # 43 tests across 8 suites (Jest + React Testing Library)
```

Covers: API routes (suggest, chat, transcribe), components (SuggestionCard, ChatPanel, ExportButton), hooks (useAudioRecorder), and lib (groq client).

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
