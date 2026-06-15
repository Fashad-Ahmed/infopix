import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";
import * as cheerio from "cheerio";
import {
  StudioInputSchema,
  InfographicContentSchema,
  BrandStyleSchema,
  SlotAssignmentSchema,
  StudioFinalPayloadSchema,
  TEMPLATE_DEFINITIONS,
} from "../schemas/schema";
import {
  extractStyleStep,
  reviewDraftStep,
  generateImagesStep,
} from "./infographic-workflow";
import { studioResearchAgent, studioResearchAgentFallback } from "../agents/infographic-agent";
import { withFallback } from "../utils/with-fallback";
import { getLanguageDirective } from "../../lib/locale-prompt";

type SectionType = "metric" | "chart" | "comparison" | "takeaway" | "callout" | "pictograph";

// Semantic icon tokens the agent may assign. Kept in sync with
// src/components/studio/iconMap.tsx (resolver tolerates unknown tokens).
const ICON_TOKEN_HINT =
  "money, revenue, profit, loss, cost, price, investment, growth, increase, decline, decrease, " +
  "people, person, population, users, customers, audience, time, year, date, speed, global, country, " +
  "location, region, company, industry, factory, market, work, technology, computer, mobile, internet, " +
  "data, code, network, cloud, security, chart, pie, trend, percent, warning, success, energy, target, " +
  "award, idea, launch, fire, star, quote, sparkle, trophy, layers, box, package, scale, activity, hash, " +
  "shopping, coffee, car, transport, flight, health, heart, education, environment, nature, water, sun, " +
  "temperature, recycle, battery, fuel, home";

// Studio-specific content extraction using Gemini 2.5 Pro for maximum richness.
const extractStudioContentStep = createStep({
  id: "extract-content",
  inputSchema: StudioInputSchema,
  outputSchema: InfographicContentSchema,
  execute: async ({ inputData }) => {
    const langDirective = getLanguageDirective(inputData.locale ?? "en");
    const density = inputData.density ?? "standard";
    const sectionTarget = density === "deep-dive" ? "10-12" : density === "executive-summary" ? "6-8" : "8-10";

    let sourceContext = "";

    if (inputData.mode === "url" && inputData.rawText.startsWith("http")) {
      const BROWSER_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
      const rawUrl = inputData.rawText.startsWith("https://r.jina.ai/")
        ? inputData.rawText.slice("https://r.jina.ai/".length)
        : inputData.rawText;

      const directRes = await fetch(rawUrl, {
        headers: { "User-Agent": BROWSER_UA, Accept: "text/html,text/plain,*/*" },
      }).catch(() => null);

      if (directRes?.ok) {
        const raw = await directRes.text();
        const ct = directRes.headers.get("content-type") ?? "";
        if (ct.includes("text/html")) {
          const $ = cheerio.load(raw);
          $("script, style, nav, footer, header").remove();
          sourceContext = $("body").text().replace(/\s+/g, " ").trim().slice(0, 20000);
        } else {
          sourceContext = raw.slice(0, 20000);
        }
      } else {
        const jinaUrl = `https://r.jina.ai/${rawUrl}`;
        const jinaRes = await fetch(jinaUrl, {
          headers: { "User-Agent": BROWSER_UA, Accept: "text/plain,*/*", "X-Return-Format": "text" },
        }).catch(() => null);
        if (jinaRes?.ok) {
          sourceContext = (await jinaRes.text()).slice(0, 20000);
        }
      }
    }

    const isUrlMode = inputData.mode === "url" && sourceContext.length > 0;

    const prompt = isUrlMode
      ? `
You are a world-class data journalist at Bloomberg or The Economist.
Analyze the following source content and produce a data-rich infographic JSON.

${langDirective}
Density: ${density} — generate ${sectionTarget} sections.

SOURCE CONTENT:
${sourceContext.slice(0, 12000)}

INSTRUCTIONS:
- Extract EVERY statistic, percentage, dollar figure, date, and named fact from the source
- For each data point, add context: year, comparison baseline, significance
- Do not invent data; enrich formatting and context from your knowledge of the topic
- Use ALL 7 section types: metric, comparison, chart, takeaway, callout, pictograph, and chart with chartType "bubble"
- comparison: 5-6 items with real ranked values, scaleDescription, valueLabel per item
- chart (bar/pie/donut): 6-8 data points for trend/distribution
- chart (bubble): 4-6 items for proportional size comparison (categories, flavors, segments) — visually striking
- pictograph: 2-5 rows of icon arrays for "X out of Y" or per-capita comparisons (e.g. consumption by country, adoption rate by group). rows[].count can be decimal. rows[].total = 10 works well.
- takeaway: 6-8 specific data-backed bullet points (not generic summaries)
- callout: single most striking milestone — big stat + full-sentence quote + attribution
- Every section MUST have an imagePrompt (vivid editorial illustration, no text in image)
- Every section MUST have an "icon" token chosen from: ${ICON_TOKEN_HINT}. Pick the token that best matches the section's meaning.
- pictograph: set "iconToken" to the glyph representing the unit (e.g. "coffee" for cups, "car" for vehicles, "person"/"people" for population). Optionally set per-row "icon".
- comparison: optionally set a per-item "icon" token on each item for an icon-led ranked list.
- chart: prefer "radial" for ranked progress (3-6 items, value 0-100) and "area" for time-series trends; use bar/donut/bubble otherwise.
- Include heroImagePrompt for the banner
- metric value field: NEVER use underscores or trailing chars. Use only the actual figure e.g. "$5", "42", "$50B+"

Return valid JSON only. No markdown, no code fences.
`.trim()
      : `
You are a world-class data journalist and information designer.
Topic: "${inputData.rawText}"
${langDirective}
Density: ${density} — generate ${sectionTarget} sections.

MISSION: Produce the richest, most data-dense infographic content possible.
Think Bloomberg terminal — every section packed with real, specific, verifiable data.

REQUIREMENTS:
- EXACTLY ${sectionTarget} sections with ZERO redundancy between them
- Every metric: SPECIFIC number + year + comparison baseline
  REJECTED: "Netflix has many subscribers"
  ACCEPTED: "260.8M global paid subscribers as of Q4 2023, up 12.8% YoY"
- comparison: 5-6 items ranked by real values, scaleDescription explains the scale
- chart (bar/pie/donut): 6-8 data points, trend or distribution story
- chart (bubble): 4-6 proportional circles — use for category/segment size comparisons where relative magnitude matters visually
- pictograph: rows of person/unit icons for per-capita or "X of Y" stats. Example: rows=[{label:"USA",count:8.5,total:10,valueLabel:"85%"},...]. Use when you have comparative adoption/consumption data across 2-5 groups.
- takeaway: 6-8 specific, non-obvious, data-backed insights (not generic)
- callout: single most stunning fact — compelling quote sentence + key stat + source attribution
- Use ALL 7 section types across sections: metric, comparison, chart(bar/donut), chart(bubble), pictograph, takeaway, callout
- chart: also use "radial" (ranked progress rings, 3-6 items value 0-100) and "area" (time-series trend) where the data fits
- Every section MUST have imagePrompt (vivid editorial illustration, no text in image)
- Every section MUST have an "icon" token chosen from: ${ICON_TOKEN_HINT}. Pick the token that best matches the section's meaning.
- pictograph: set "iconToken" to the glyph representing the unit (e.g. "coffee" for cups, "car" for vehicles, "person"/"people" for population). Optionally set per-row "icon".
- comparison: optionally set a per-item "icon" token on each item for an icon-led ranked list.
- Include heroImagePrompt for the banner
- metric value field: NEVER use underscores or trailing characters. Use only the actual figure e.g. "$5", "42", "$50B+", "260M"

Return valid JSON only. No markdown, no code fences.
`.trim();

    const res = await withFallback(
      studioResearchAgent,
      studioResearchAgentFallback,
      prompt,
      {
        structuredOutput: {
          schema: InfographicContentSchema,
          jsonPromptInjection: true,
        },
      },
    ) as { object?: z.infer<typeof InfographicContentSchema> | null; text?: string };

    let obj = res.object;
    if (!obj && res.text) {
      try {
        const cleaned = res.text.replace(/```json/gi, "").replace(/```/g, "").trim();
        obj = JSON.parse(cleaned) as typeof obj;
      } catch {
        /* fall through */
      }
    }
    if (!obj) {
      console.error("[studio-content] structured output missing:", res.text?.slice(0, 500));
      throw new Error("Studio research agent returned no structured content.");
    }

    // Sanitize: strip AI padding chars + truncate strings to schema limits
    function trunc(v: unknown, max: number): string | undefined {
      if (typeof v !== "string") return undefined;
      return v.replace(/[_\s]+$/, "").trim().slice(0, max);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function sanitizeSection(s: any): any {
      // AI sometimes returns chartType values ("radial", "area", "bubble") as the
      // section type discriminator instead of "chart". Normalise them back.
      const CHART_SUBTYPES = new Set(["bar", "pie", "donut", "bubble", "radial", "area"]);
      if (CHART_SUBTYPES.has(s.type)) {
        s = { ...s, chartType: s.chartType ?? s.type, type: "chart" };
      }

      const base = {
        ...s,
        heading:    trunc(s.heading, 80)    ?? s.heading,
        subheading: trunc(s.subheading, 160) ?? s.subheading,
        insight:    trunc(s.insight, 400)    ?? s.insight,
        imagePrompt: trunc(s.imagePrompt, 400) ?? s.imagePrompt,
        unit:       trunc(s.unit, 20)       ?? s.unit,
      };
      if (s.type === "metric") {
        return { ...base, value: trunc(s.value, 12) ?? s.value, unit: trunc(s.unit, 20) ?? s.unit };
      }
      if (s.type === "callout") {
        return { ...base, quote: trunc(s.quote, 300) ?? s.quote, stat: trunc(s.stat, 30) ?? s.stat, attribution: trunc(s.attribution, 120) ?? s.attribution };
      }
      if (s.type === "comparison" && Array.isArray(s.items)) {
        return { ...base, items: s.items.map((item: any) => ({ ...item, description: trunc(item.description, 140) ?? item.description, valueLabel: trunc(item.valueLabel, 20) ?? item.valueLabel })) };
      }
      if (s.type === "takeaway" && Array.isArray(s.points)) {
        return { ...base, points: s.points.map((p: string) => typeof p === "string" ? p.slice(0, 120) : p) };
      }
      if (s.type === "pictograph") {
        const rows = Array.isArray(s.rows) ? s.rows.map((r: any) => ({
          ...r,
          label: trunc(r.label, 40) ?? r.label,
          valueLabel: trunc(r.valueLabel, 20) ?? r.valueLabel,
        })) : s.rows;
        return { ...base, rows, iconLabel: trunc(s.iconLabel, 40) ?? s.iconLabel };
      }
      return base;
    }

    if (obj && typeof obj === "object") {
      const o = obj as Record<string, unknown>;
      if (typeof o.title === "string") o.title = o.title.slice(0, 120);
      if (typeof o.summary === "string") o.summary = o.summary.slice(0, 500);
      if (typeof o.heroImagePrompt === "string") o.heroImagePrompt = o.heroImagePrompt.slice(0, 400);
      if (Array.isArray(o.sections)) o.sections = (o.sections as unknown[]).map(sanitizeSection);
    }

    return InfographicContentSchema.parse(obj);
  },
});

/**
 * Deterministic slot assignment: match sections to template slots by type priority.
 */
function assignSections(
  sections: Array<{ type: string }>,
  template: string,
): z.infer<typeof SlotAssignmentSchema> {
  const def = TEMPLATE_DEFINITIONS[template];
  if (!def) throw new Error(`Unknown template: ${template}`);

  const queues: Record<SectionType, number[]> = {
    metric: [],
    chart: [],
    comparison: [],
    takeaway: [],
    callout: [],
    pictograph: [],
  };
  sections.forEach((s, i) => {
    if (s.type in queues) queues[s.type as SectionType].push(i);
  });

  const slots: Record<string, number | null> = {};

  for (const [slotName, slotDef] of Object.entries(def.slots)) {
    if (slotDef.regionType === "banner" || slotDef.regionType === "footer") {
      slots[slotName] = null;
      continue;
    }

    let assigned: number | null = null;
    for (const t of slotDef.acceptedTypes) {
      const q = queues[t as SectionType];
      if (q && q.length > 0) {
        assigned = q.shift()!;
        break;
      }
    }
    slots[slotName] = assigned;
  }

  // Second pass: backfill any empty content slot with a leftover section the
  // renderer can still display there, even if its type wasn't first-choice
  // for that slot. Mirrors StudioCanvas's region-compatibility rules.
  for (const [slotName, slotDef] of Object.entries(def.slots)) {
    if (slots[slotName] !== null) continue;
    if (slotDef.regionType === "banner" || slotDef.regionType === "footer") continue;

    for (const t of REGION_FALLBACK_TYPES[slotDef.regionType] ?? []) {
      const q = queues[t];
      if (q && q.length > 0) {
        slots[slotName] = q.shift()!;
        break;
      }
    }
  }

  return { template, slots };
}

// Fallback section types a slot can still render if its preferred
// acceptedTypes are exhausted — mirrors StudioCanvas's rendering branches.
const REGION_FALLBACK_TYPES: Record<string, SectionType[]> = {
  stat: ["metric", "callout", "pictograph"],
  callout: ["callout", "metric"],
  chart: ["chart", "comparison"],
  comparison: ["comparison", "chart"],
  takeaway: ["takeaway", "callout", "pictograph"],
  pictograph: ["pictograph", "metric", "callout"],
};

const assignSlotsStep = createStep({
  id: "assign-slots",
  inputSchema: z.any(),
  outputSchema: SlotAssignmentSchema,
  execute: async ({ getInitData, getStepResult }) => {
    const initData = getInitData() as z.infer<typeof StudioInputSchema>;
    const template = initData.template ?? "editorial-portrait";

    const images = getStepResult("generate-images") as z.infer<typeof InfographicContentSchema> | null;
    const content = images ?? (getStepResult("extract-content") as z.infer<typeof InfographicContentSchema>);

    return assignSections(content.sections, template);
  },
});

const assembleStudioPayloadStep = createStep({
  id: "assemble-studio-payload",
  inputSchema: z.any(),
  outputSchema: StudioFinalPayloadSchema,
  execute: async ({ getInitData, getStepResult }) => {
    const initData = getInitData() as z.infer<typeof StudioInputSchema>;

    const style          = getStepResult("extract-style") as z.infer<typeof BrandStyleSchema>;
    const images         = getStepResult("generate-images") as z.infer<typeof InfographicContentSchema> | null;
    const content        = images ?? (getStepResult("extract-content") as z.infer<typeof InfographicContentSchema>);
    const qaReport       = getStepResult("review-draft");
    const slotAssignment = getStepResult("assign-slots") as z.infer<typeof SlotAssignmentSchema>;

    return StudioFinalPayloadSchema.parse({
      content,
      style,
      qaReport,
      slotAssignment,
      studioConfig: {
        template:          initData.template,
        primaryFont:       initData.primaryFont,
        accentStyle:       initData.accentStyle,
        illustrationStyle: initData.illustrationStyle,
        showSourceFooter:  initData.showSourceFooter,
        colorScheme:       initData.colorScheme,
        userPrimary:       initData.userPrimary,
        userAccent:        initData.userAccent,
        userBackground:    initData.userBackground,
      },
    });
  },
});

export const studioWorkflow = createWorkflow({
  id: "studio-orchestrator",
  inputSchema: StudioInputSchema,
  outputSchema: StudioFinalPayloadSchema,
})
  .then(extractStudioContentStep)
  .then(extractStyleStep)
  .then(reviewDraftStep)
  .then(generateImagesStep)
  .then(assignSlotsStep)
  .then(assembleStudioPayloadStep)
  .commit();
