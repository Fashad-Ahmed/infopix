import { Agent } from "@mastra/core/agent";
import { scrapeWebsiteTool } from "../tools/scraper";

// Responsible for scraping and summarizing URL content.

export const contentAgent = new Agent({
  id: "content-architect-agent",
  name: "Content Architect",
  instructions:
    "You are an expert web researcher. If the user provides a URL, your ONLY job is to use the scrapeWebsiteTool to fetch it. Do not format the output. Just return the raw scraped text.",
  model: "groq/llama-3.3-70b-versatile",
  tools: {
    scrapeWebsiteTool,
  },
});

// Responsible for extracting the design system from an uploaded image.

const STYLE_SYSTEM_PROMPT = `
You are a Lead UI/UX Designer. Analyze the provided image of organizational material (e.g., a slide deck, logo, or report).
Extract the core design system into the requested JSON schema.
Ensure your hex codes are accurate and identify the overall 'mood' of the typography.
`;

export const styleAgent = new Agent({
  id: "brand-visionary-agent",
  name: "Brand Visionary",
  instructions: STYLE_SYSTEM_PROMPT,
  model: "google/gemini-2.5-flash",
});

// Responsible for reviewing the Content Architect's output.

const CRITIC_SYSTEM_PROMPT = `
You are a ruthless Quality Assurance Editor.
Review the drafted infographic data against the original raw text.
Your ONLY job is to identify hallucinations, logical errors, or formatting issues.
If the draft is accurate, approve it. If not, provide specific feedback on what needs to be fixed.
`;

export const criticAgent = new Agent({
  id: "qa-critic-agent",
  name: "Quality Assurance Critic",
  instructions: CRITIC_SYSTEM_PROMPT,
  model: "groq/llama-3.3-70b-versatile",
});

// URL-mode formatter: structures raw scraped text into infographic JSON.
// Using GPT-4o for superior JSON schema adherence.
const FORMATTER_SYSTEM_PROMPT = `
You are a Senior Data Journalist. Transform raw source text into high-signal structured JSON for an infographic.

RULES:
1. Extract ONLY facts present in the source. No hallucination.
2. Prefer specific numbers over vague statements.
3. Use all 5 section types: metric, comparison, chart, takeaway, callout.
4. Output valid JSON matching the schema exactly. No markdown, no commentary.
`;

export const formatterAgent = new Agent({
  id: "formatter-agent",
  name: "Data Formatter",
  instructions: FORMATTER_SYSTEM_PROMPT,
  model: "openai/gpt-4o",
});

// Derives a brand style system from a natural-language prompt (no image input).
const STYLE_FROM_TEXT_PROMPT = `
You are a Lead UI/UX Designer. The user has described a desired infographic look in plain English.
Translate that description into a concrete brand design system matching the requested JSON schema.
Pick hex codes that match the mood. Choose fontMood and layoutDensity from the allowed enums.
If the description is vague, lean on the dominant adjective (e.g., "playful" -> bright accent, rounded radius).
`;

export const styleFromTextAgent = new Agent({
  id: "brand-from-text-agent",
  name: "Brand Stylist (Text)",
  instructions: STYLE_FROM_TEXT_PROMPT,
  model: "groq/llama-3.3-70b-versatile",
});

// Generates infographic content from a topic for the regular (non-studio) infographic.
// Using Gemini Flash for better world knowledge than LLaMA.
const TOPIC_SYSTEM_PROMPT = `
You are a Senior Data Journalist creating an educational infographic about a topic.
Draw on your broad training knowledge — use specific statistics, dates, and named facts.

RULES:
1. Use specific numbers with context (year, source type, comparison baseline).
2. Use all 5 section types: metric, comparison, chart, takeaway, callout.
3. For each section, include a short imagePrompt (1 sentence, concrete visual, no text in image).
4. Include a heroImagePrompt for the top — 1 sentence, evocative, no text in image.
5. Output valid JSON matching the schema exactly. No markdown.
`;

export const topicContentAgent = new Agent({
  id: "topic-content-agent",
  name: "Topic Content Architect",
  instructions: TOPIC_SYSTEM_PROMPT,
  model: "google/gemini-2.5-flash",
});

export const styleAgentFallback = new Agent({
  id: "brand-visionary-agent-fallback",
  name: "Brand Visionary (GPT Fallback)",
  instructions: STYLE_SYSTEM_PROMPT,
  model: "openai/gpt-4o",
});

export const topicContentAgentFallback = new Agent({
  id: "topic-content-agent-fallback",
  name: "Topic Content Architect (GPT Fallback)",
  instructions: TOPIC_SYSTEM_PROMPT,
  model: "openai/gpt-4o",
});

// Studio deep research agent: uses Gemini 2.5 Pro for maximum content richness.
// Used exclusively by the studio workflow for data-dense, publication-grade output.
const STUDIO_RESEARCH_SYSTEM_PROMPT = `
You are a world-class data journalist and information designer at a publication like The Economist or Bloomberg.
Your job is to produce the richest, most data-dense infographic content possible.

MANDATE:
- Think like a Bloomberg terminal — every section must be packed with real, specific, verifiable data
- Cite years, percentages, dollar amounts, named entities
- Draw on your comprehensive training knowledge for well-known topics
- Never be vague: "grew significantly" is REJECTED; "$33.7B revenue, up 6.7% YoY (2023)" is ACCEPTED

SECTION TYPES — use all 5:
- "metric": one impactful number. Fields: heading, value (MAX 12 chars), unit, trend, subheading (timeframe), insight (2 sentences: the stat + why it matters)
- "comparison": ranked landscape. Fields: heading, scaleDescription (e.g. "Global market share %"), items (5-6: label, value 0-100, valueLabel e.g. "38%", isHighlight, description), insight
- "chart": categorical breakdown. Fields: heading, chartType (pie/donut/bar/bubble/radial/area), data (6-8: label, value, valueLabel), unit, insight. Use "radial" for ranked progress rings (3-6 items, value 0-100), "area" for time-series trends.
- "takeaway": conclusions. Fields: heading, points (6-8 specific data-backed strings under 120 chars each), insight
- "callout": single stunning milestone. Fields: heading, quote (complete sentence — the striking fact), stat (key figure e.g. "$33.7B"), attribution (source context)
- "pictograph": icon-array comparison. Fields: heading, rows (label, count, total, valueLabel), iconLabel, iconToken (glyph to repeat e.g. "coffee"/"car"/"person"), insight

MANDATORY per section: imagePrompt (one vivid sentence, editorial illustration, no text in image)
MANDATORY per section: icon (a short semantic token like "money", "growth", "people", "global", "technology" that matches the section meaning — the renderer turns it into a vector icon)
ALSO include: heroImagePrompt for the banner

Return valid JSON only. No markdown, no code fences, no commentary.
`;

export const studioResearchAgent = new Agent({
  id: "studio-research-agent",
  name: "Studio Research Agent",
  instructions: STUDIO_RESEARCH_SYSTEM_PROMPT,
  model: "google/gemini-2.5-pro",
});

export const studioResearchAgentFallback = new Agent({
  id: "studio-research-agent-fallback",
  name: "Studio Research Agent (GPT Fallback)",
  instructions: STUDIO_RESEARCH_SYSTEM_PROMPT,
  model: "openai/gpt-4o",
});
