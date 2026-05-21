import { Agent } from "@mastra/core/agent";
import { scrapeWebsiteTool } from "../tools/scraper";

// Responsible for extracting facts and deciding the best visual format.

const CONTENT_SYSTEM_PROMPT = `
You are a Senior Data Journalist. Your job is to transform raw text into high-signal structured data for an infographic.

CRITICAL RULES:
1. THINK STEP-BY-STEP: Read the text, identify the narrative focus, and extract the most important points.
2. CATEGORIZE SMARTLY: You must categorize each section using the provided discriminated unions:
   - Use 'metric' for single, impactful numbers.
   - Use 'comparison' when contrasting 2-4 items.
   - Use 'takeaway' for text-based conclusions.
3. NO HALLUCINATION: Every fact, number, or claim MUST be explicitly present in the source text. Do not invent data.
4. CONFIDENCE SCORING: Accurately score your extraction confidence (0.0 to 1.0). If the text is vague, score lower.
`;

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
  model: "groq/llama-3.2-11b-vision-preview",
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

export const formatterAgent = new Agent({
  id: "formatter-agent",
  name: "Data Formatter",
  instructions: CONTENT_SYSTEM_PROMPT,
  model: "groq/llama-3.3-70b-versatile",
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

// Generates infographic content directly from a topic, with no source document.
const TOPIC_SYSTEM_PROMPT = `
You are a Senior Data Journalist creating an educational infographic about a topic the user has named.
You have no source document — draw on widely accepted general knowledge only.

CRITICAL RULES:
1. Stick to widely known, uncontroversial facts. Avoid recent stats you can't verify.
2. Categorize sections using the discriminated unions: metric, comparison, takeaway.
3. For each section, include a short imagePrompt (1 sentence, concrete visual) describing an illustration that would support the section.
4. Include a heroImagePrompt for the top of the infographic — 1 sentence, evocative, no text in the image.
5. Score confidence honestly. Topic-generated content rarely exceeds 0.75.
`;

export const topicContentAgent = new Agent({
  id: "topic-content-agent",
  name: "Topic Content Architect",
  instructions: TOPIC_SYSTEM_PROMPT,
  model: "groq/llama-3.3-70b-versatile",
});
