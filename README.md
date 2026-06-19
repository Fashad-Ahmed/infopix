# InfoPix — Agentic Infographic Engine

InfoPix turns a URL or a plain-English topic into a visually polished, brand-aware infographic. A multi-agent **Mastra** workflow extracts content, derives style, generates supporting AI imagery, and assembles a template-driven layout — all behind a couple of Next.js endpoints.

The app ships two generators:

- **Studio** (`/`, default page) — template-based layout engine. Pick one of 9 canvas formats, a font, a palette, and an accent style; Gemini researches and structures the content, then it's deterministically slotted into the chosen grid.
- **Classic** (`/classic`) — the original single-column generator. Groq-powered content/style/critic pipeline, simpler card-stack output.

## Features

- **Two input modes** (both generators) — paste a URL (scraped via direct fetch + Jina AI reader fallback) or type a topic for knowledge-based generation.
- **9 Studio templates** — `editorial-portrait`, `editorial-landscape`, `social-square`, `social-wide`, `poster`, `sidebar-portrait`, `asymmetric-landscape`, `banner-bottom-square`, `magazine-grid`. Each defines its own CSS-grid slot map; empty slots collapse or get absorbed by neighboring content automatically (see `src/lib/canvas-grid.ts`).
- **6 section types** — `metric`, `comparison`, `chart` (`pie`/`donut`/`bar`/`bubble`/`radial`/`area` via Recharts), `takeaway`, `callout`, `pictograph`. Schema-driven discriminated union, validated with Zod.
- **7 fonts, multiple accent/illustration styles** — `condensed-sans`, `modern-sans`, `slab`, `display-serif`, `corporate`, `playful`, `monospaced`.
- **Custom styling** — natural-language style prompt (e.g. _"minimalist, dark navy + neon accent"_) converted into a brand system (colors, font mood, radius, density), plus 8 built-in color-scheme presets and a custom-color picker.
- **AI imagery** — optional hero + per-section images via OpenAI (`gpt-image-1`, switchable to `dall-e-3`). Images embed as data URLs so PNG/PDF exports stay self-contained.
- **PNG & PDF export** — client-side capture via `html-to-image` + `jspdf`.
- **Inline editing** — Studio supports editing generated text in place and reordering/swapping sections between slots without regenerating.
- **Light / dark theming** — synced with `prefers-color-scheme`, persisted to `localStorage`, contrast-corrected per brand color, with a CSS-only glossy background decoration (`src/components/BackgroundDecor.tsx`).
- **Observability** — Mastra Studio traces every run with token usage, latency, and per-agent reasoning. LibSQL (Turso in prod) + DuckDB locally.

## Quick start

Requires Node.js `>=22.13.0` and Yarn.

```bash
yarn install
cp .env.example .env   # then fill in keys
yarn dev               # http://localhost:3000
```

### Environment variables

| Variable                | Required  | Purpose                                                                       |
| ------------------------ | ---------- | ------------------------------------------------------------------------------ |
| `GROQ_API_KEY`           | yes        | Classic generator agents (Llama 3.3 70B via Groq) + style-from-text fallback.  |
| `GOOGLE_API_KEY` or `GEMINI_API_KEY` | yes | Studio research agent (Gemini 2.5 Pro) + style/topic agents (Gemini 2.5 Flash). Either name works — aliased to `GOOGLE_GENERATIVE_AI_API_KEY` in `src/mastra/env.ts`. |
| `OPENAI_API_KEY`         | optional\* | AI image generation, and the fallback model for Gemini-backed agents.         |
| `OPENAI_IMAGE_MODEL`     | optional   | Override image model. Defaults to `gpt-image-1`. Set to `dall-e-3` for legacy.|

\* Image generation is silently skipped (warning logged) if `OPENAI_API_KEY` is missing. Without it, agents that depend on an OpenAI fallback also lose that fallback path.

### Commands

```bash
yarn dev     # next dev (also boots Mastra runtime)
yarn build   # next build (production)
yarn start   # next start
yarn lint    # eslint
yarn test    # vitest run
```

## Architecture

### Studio workflow

`src/mastra/workflows/studio-workflow.ts` — runs `extract-content` (Gemini 2.5 Pro research agent, with OpenAI fallback) → `extract-style` → `review-draft` → `generate-images` (conditional) → `assign-slots` (deterministic section-to-template-slot matching, with a fallback pass for type mismatches) → `assemble-studio-payload`.

### Classic workflow

`src/mastra/workflows/infographic-workflow.ts` — a 5-step DAG:

```
extract-content ─┐
                 ├─► review-draft (skipped in topic mode)
extract-style ───┤
                 └─► generate-images (conditional) ─► assemble-payload
```

| Step              | Responsibility                                                                                              |
| ----------------- | ----------------------------------------------------------------------------------------------------------- |
| `extract-content` | URL mode: direct fetch → cheerio strip → Jina fallback → Groq summarise → structured format. Topic mode: direct generation from topic prompt (Gemini). |
| `extract-style`   | Branches: reference image → `styleAgent` (vision) → `styleFromTextAgent` (text) → default palette.          |
| `review-draft`    | `criticAgent` compares draft against source for hallucinations. Skipped when no source exists.              |
| `generate-images` | Parallel calls to OpenAI image API. One hero + one per section.                                             |
| `assemble-payload`| Merges into the final payload schema.                                                                       |

### Project layout

```
app/
├── page.tsx                      # Studio — the main app page
├── classic/page.tsx               # Classic single-column generator
├── studio/page.tsx                 # Permanent redirect → "/" (legacy path)
├── api/generate/route.ts          # Classic generator endpoint
├── api/studio-generate/route.ts   # Studio endpoint
├── api/spoki-*/                   # WhatsApp/Spoki integration
└── whatsapp/                      # WhatsApp UI page

src/
├── components/
│   ├── BackgroundDecor.tsx        # Global glossy CSS background
│   ├── studio/                    # Studio UI
│   │   ├── StudioForm.tsx, StudioCanvas.tsx, StudioEditPanel.tsx
│   │   ├── BrandKitPanel.tsx, DesignKitPanel.tsx, LayoutWireframe.tsx
│   │   ├── regions/                # One renderer per section type
│   │   │   └── charts/             # One renderer per chart type (bar/donut/bubble/radial/area)
│   │   └── use*.ts                 # Per-component state/options hooks
│   ├── infographic/                # Classic generator render layer
│   └── generator/                  # Classic generator input/control layer
├── hooks/
│   ├── useTheme.ts, useToasts.ts
│   ├── useInfographicGenerator.ts / useInfographicDownload.ts   # Classic
│   └── useStudioGenerator.ts                                     # Studio
├── lib/
│   ├── api-client.ts, api-error.ts, download.ts, slug.ts
│   ├── canvas-grid.ts              # Pure grid-area algorithms (slot collapse/grow), unit-tested
│   ├── infographic-payload.ts, infographic-theme.ts
│   └── design-kit.ts, brand-kit.ts # Live typography/logo overrides
├── types/infographic.ts            # Zod-derived TypeScript types
└── mastra/
    ├── index.ts                    # Mastra registration (agents/workflows/tools/storage)
    ├── agents/infographic-agent.ts
    ├── workflows/{infographic,studio}-workflow.ts
    ├── tools/{scraper,graphify-context,image-generator}.ts
    └── schemas/schema.ts           # TEMPLATE_DEFINITIONS + discriminated-union content schema
```

### Section schema (discriminated by `type`)

| Type         | Required                                                                                   | Optional                                          |
| ------------ | -------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `metric`     | `heading`, `value`, `insight`                                                                | `unit`, `trend`, `subheading`, `imagePrompt`       |
| `comparison` | `heading`, `items[]` (2-8) with `label` + `value` (0-100) + `isHighlight`                    | `valueLabel`, `description`, `scaleDescription`, `insight` |
| `chart`      | `heading`, `chartType` (`pie`/`donut`/`bar`/`bubble`/`radial`/`area`), `data[]` (2-10)        | `unit`, `insight`, `subheading`, `imagePrompt`     |
| `takeaway`   | `heading`, `points[]` (2-8)                                                                  | `insight`, `subheading`, `imagePrompt`             |
| `callout`    | `heading`, `quote`                                                                           | `stat`, `attribution`                              |
| `pictograph` | `heading`, `rows[]` (2-6) with `label` + `count` + `total`                                   | `valueLabel`, `iconLabel`, `iconToken`, `insight`   |

All optional fields are `.nullable().optional()` — Gemini frequently emits `null` instead of omitting a field, and the schema needs to accept either (see `stripNulls` in `studio-workflow.ts` for the recursive pre-validation pass).

## API

### `POST /api/studio-generate`

```jsonc
{
  "rawText": "https://example.com/post",      // URL or topic text
  "mode": "topic",                             // "url" | "topic"
  "template": "editorial-landscape",           // one of the 9 templates
  "primaryFont": "modern-sans",
  "accentStyle": "rule",                        // "rule" | "ribbon" | "stamp" | "none"
  "illustrationStyle": "flat",                  // "flat" | "editorial" | "minimal" | "none"
  "colorScheme": "brand",                       // preset id, or "custom" + userPrimary/userAccent/userBackground
  "density": "standard",                        // "executive-summary" | "standard" | "deep-dive"
  "generateImages": true
}
```

Returns the studio final payload: `{ content, style, qaReport, slotAssignment, studioConfig }`.

### `POST /api/generate` (classic)

```jsonc
{
  "rawText": "https://example.com/post",
  "mode": "url",
  "stylePrompt": "minimalist, navy + neon",
  "generateImages": false,
  "density": "standard",
  "narrativeFocus": "data-heavy"
}
```

Returns `{ content, style, qaReport }`.

## Deploy to Vercel

The whole stack (Next.js + Mastra workflow) ships as a single Vercel project. Mastra runs in-process inside API routes.

### 1. Provision Turso (remote LibSQL)

Vercel serverless filesystems are ephemeral, so the local `file:./mastra.db` won't persist. Use Turso instead.

```bash
brew install tursodatabase/tap/turso
turso auth signup
turso db create infopix
turso db show infopix --url           # libsql://...
turso db tokens create infopix        # auth token
```

### 2. Set environment variables on Vercel

Project Settings → Environment Variables — set every variable from the table above (`GROQ_API_KEY`, `GOOGLE_API_KEY`/`GEMINI_API_KEY`, `OPENAI_API_KEY`, `OPENAI_IMAGE_MODEL`), plus:

| Variable             | Required | Notes                                       |
| -------------------- | -------- | ------------------------------------------- |
| `TURSO_DATABASE_URL` | yes      | `libsql://...` from `turso db show`.        |
| `TURSO_AUTH_TOKEN`   | yes      | From `turso db tokens create`.              |
| `SPOKI_*`            | optional | Only if using the WhatsApp integration.     |

A production deploy with a missing/invalid key for any agent's model provider will surface as a "Generation failed" error at request time — check the route's logs for which agent/provider failed.

### 3. Deploy

```bash
yarn global add vercel
vercel link
vercel --prod
```

Or push to GitHub and import the repo in the Vercel dashboard for auto-deploys.

### Deployment notes

- **Function timeout**: API routes declare `maxDuration = 300`. Vercel Hobby caps at 60s; Pro is required for full 300s.
- **Runtime**: All API routes pinned to `runtime = "nodejs"` (Mastra needs Node APIs; Edge runtime is incompatible).
- **DuckDB**: Native module, disabled in production via `NODE_ENV === "production"` check in `src/mastra/index.ts`. Local dev still gets full Mastra Studio observability.
- **Region**: `vercel.json` pins to `fra1`. Change to one near your LLM provider (`iad1` for US-east, `sfo1` for US-west).
- **Mastra Studio**: Dev-only. Inspect production traces by querying Turso directly or running `yarn dev` locally pointed at the same DB.

## Observability

Run `yarn dev` and open Mastra Studio at `http://localhost:4111` for per-run traces: token usage, tool execution latency, agent reasoning, and step outputs. Storage: LibSQL (`mastra.db` locally, Turso in prod) + DuckDB for the observability domain (dev only).

## License

MIT.
