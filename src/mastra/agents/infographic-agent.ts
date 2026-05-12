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
  instructions: CONTENT_SYSTEM_PROMPT,
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
  model: "groq/llama-3.1-8b-instant",
});
