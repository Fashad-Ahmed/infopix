# InfoPix — Agentic Infographic Engine

InfoPix turns a URL or a plain-English topic into a visually polished, brand-aware infographic. A multi-agent **Mastra** workflow extracts content, derives style, generates supporting AI imagery, and validates output against the source — all behind a single Next.js endpoint.

## Features

- **Two input modes**
  - **URL mode** — scrapes a public web page (direct fetch + Jina fallback) and summarises it.
  - **Topic mode** — generates an educational infographic from a free-text topic, no source document required.
- **Multi-agent pipeline** — `topicContentAgent` / `contentAgent` → `formatterAgent` → `criticAgent` (URL only) → `styleAgent` / `styleFromTextAgent` → image generation.
- **Custom styling** — natural-language style prompt (e.g. _"minimalist, dark navy + neon accent"_) is converted into a brand system (colors, font mood, radius, density). Image-based style extraction also supported via `referenceImageBase64`.
- **AI imagery** — optional hero + per-section images via OpenAI (`gpt-image-1` by default, switchable to `dall-e-3`). Images embed as data URLs so PNG/PDF exports stay self-contained.
- **Mixed section types** — `metric`, `comparison` (with per-bar descriptions + scale caption), `chart` (`pie` / `donut` / `bar` via Recharts), `takeaway`. Schema-driven discriminated union.
- **PNG & PDF export** — client-side capture via `html-to-image` + `jspdf`. Captures the full scroll width so nothing clips.
- **Light / dark theming** — synced with `prefers-color-scheme`, persisted to `localStorage`, contrast-corrected per brand color.
- **Observability** — Mastra Studio traces every run with token usage, latency, and per-agent reasoning. DuckDB + Pino backed.

## Quick start

Requires Node.js `>=22.13.0` and Yarn.

```bash
yarn install
cp .env.example .env   # then fill in keys
yarn dev               # http://localhost:3000
```

### Environment variables

| Variable             | Required           | Purpose                                                                                  |
| -------------------- | ------------------ | ---------------------------------------------------------------------------------------- |
| `GROQ_API_KEY`       | yes                | Powers content, formatter, critic, style-from-text agents (Llama 3.x via Groq).          |
| `OPENAI_API_KEY`     | optional\*         | Required for AI image generation (topic mode + opt-in URL mode).                         |
| `OPENAI_IMAGE_MODEL` | optional           | Override image model. Defaults to `gpt-image-1`. Set to `dall-e-3` for legacy behavior.  |

\* Topic mode and the "Generate AI imagery" checkbox silently skip image rendering if `OPENAI_API_KEY` is missing (warning logged).

### Commands

```bash
yarn dev     # next dev (also boots Mastra runtime)
yarn build   # next build (production)
yarn start   # next start
yarn lint    # eslint
yarn test    # vitest run
```

## Architecture

The workflow is a 5-step DAG defined in `src/mastra/workflows/infographic-workflow.ts`:

```
extract-content ─┐
                 ├─► review-draft (skipped in topic mode)
extract-style ───┤
                 └─► generate-images (conditional) ─► assemble-payload
```

| Step              | Responsibility                                                                                              |
| ----------------- | ----------------------------------------------------------------------------------------------------------- |
| `extract-content` | URL mode: direct fetch → cheerio strip → Jina fallback → Groq summarise → structured format. Topic mode: direct generation from topic prompt. |
| `extract-style`   | Branches: reference image → `styleAgent` (vision) → `styleFromTextAgent` (text) → default palette.          |
| `review-draft`    | `criticAgent` compares draft against source for hallucinations. Skipped when no source exists.              |
| `generate-images` | Parallel calls to OpenAI image API. One hero + one per section.                                             |
| `assemble-payload`| Merges into `FinalPayloadSchema`.                                                                           |

### Project layout

```
app/
├── api/generate/route.ts        # POST endpoint → workflow runner
├── api/spoki-*/                 # WhatsApp/Spoki integration
├── whatsapp/                    # WhatsApp UI page
└── page.tsx                     # Thin composition shell (~90 LOC)

src/
├── components/
│   ├── infographic/             # Render layer
│   │   ├── index.tsx            # Layout + section dispatcher
│   │   ├── MetricCard.tsx
│   │   ├── ComparisonCard.tsx
│   │   ├── ChartCard.tsx        # Recharts pie / donut / bar
│   │   ├── TakeawayCard.tsx
│   │   ├── SectionImage.tsx
│   │   └── InsightCaption.tsx
│   └── generator/               # Input/control layer
│       ├── HeaderBar.tsx
│       ├── HeroPanel.tsx
│       ├── GeneratorForm.tsx
│       ├── ModeToggle.tsx
│       ├── LoadingProgress.tsx
│       ├── DownloadToolbar.tsx
│       └── ToastStack.tsx
├── hooks/
│   ├── useTheme.ts              # Theme persistence + html.dark sync
│   ├── useToasts.ts             # Auto-dismissing toast queue
│   ├── useInfographicGenerator.ts  # Fetch + progress state machine
│   └── useInfographicDownload.ts   # PNG / PDF capture orchestration
├── lib/
│   ├── api-client.ts            # Typed fetch wrapper + GenerateError
│   ├── download.ts              # html-to-image + jspdf pipeline
│   ├── slug.ts                  # Filename slugify
│   ├── infographic-payload.ts   # Server payload picker + normalizer
│   └── infographic-theme.ts     # Contrast-aware color derivation
├── types/
│   └── infographic.ts           # Zod-derived TypeScript types
└── mastra/
    ├── index.ts                 # Mastra registration (agents/workflows/tools/storage)
    ├── agents/infographic-agent.ts
    ├── workflows/infographic-workflow.ts
    ├── tools/
    │   ├── scraper.ts
    │   ├── graphify-context.ts
    │   └── image-generator.ts   # OpenAI image API wrapper
    └── schemas/schema.ts        # Discriminated-union content schema
```

### Section schema (discriminated by `type`)

| Type         | Required                                                                                                   | Optional                                          |
| ------------ | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| `metric`     | `heading`, `value` (≤12 chars), `insight`                                                                  | `unit`, `trend`, `subheading`, `imagePrompt`      |
| `comparison` | `heading`, `items[]` (2-4) with `label` + `value` (0-100) + `isHighlight` + `valueLabel` + `description`   | `scaleDescription`, `insight`, `subheading`       |
| `chart`      | `heading`, `chartType` (`pie` / `donut` / `bar`), `data[]` (2-6) with `label` + `value` + `valueLabel`     | `unit`, `insight`, `subheading`, `imagePrompt`    |
| `takeaway`   | `heading`, `points[]` (2-3, ≤100 chars each)                                                               | `insight`, `subheading`, `imagePrompt`            |

## API

`POST /api/generate`

```jsonc
{
  "rawText": "https://example.com/post",   // URL or topic text
  "mode": "url",                            // "url" | "topic"
  "stylePrompt": "minimalist, navy + neon", // optional
  "generateImages": false,                  // forced true in topic mode
  "density": "standard",                    // "executive-summary" | "standard" | "deep-dive"
  "narrativeFocus": "data-heavy"            // "data-heavy" | "narrative-driven" | "action-oriented"
}
```

Returns `FinalPayloadSchema`:

```jsonc
{
  "content": { "title": "...", "summary": "...", "sections": [...], "heroImageUrl": "...", "metadata": {...} },
  "style":   { "primaryColor": "#...", "secondaryColor": "#...", "accentColor": "#...", "fontMood": "...", "borderRadius": "...", "layoutDensity": "..." },
  "qaReport":{ "isAccurate": true, "feedback": "" }
}
```

## Observability

Run `yarn dev` and open Mastra Studio at `http://localhost:4111` for per-run traces: token usage, tool execution latency, agent reasoning, and step outputs. Storage: `mastra.db` (LibSQL) + DuckDB for observability domain.

## License

MIT.
