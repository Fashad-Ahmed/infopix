import { z } from "zod";

export const InfographicInputSchema = z.object({
  rawText: z.string().min(3, "Provide a topic, URL, or content"),
  mode: z.enum(["url", "topic"]).default("url"),
  referenceImageBase64: z.string().optional(),
  stylePrompt: z
    .string()
    .max(400)
    .optional()
    .describe("Natural language description of desired infographic style"),
  generateImages: z
    .boolean()
    .default(false)
    .describe("Generate AI imagery for sections via OpenAI"),
  density: z.enum(["executive-summary", "standard", "deep-dive"]),
  narrativeFocus: z
    .enum(["data-heavy", "narrative-driven", "action-oriented"])
    .default("data-heavy"),
  locale: z.enum(["en", "it"]).default("en").describe("Output language for generated content"),
});

export const BrandStyleSchema = z.object({
  primaryColor: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid Hex"),
  secondaryColor: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid Hex"),
  accentColor: z
    .string()
    .describe("A contrasting color for highlighting critical insights"),
  fontMood: z.enum(["corporate", "modern-sans", "playful", "monospaced", "slab", "display-serif"]),
  borderRadius: z
    .string()
    .describe("Tailwind-style or CSS value (e.g., '0.5rem')"),
  layoutDensity: z
    .enum(["compact", "airy", "spacious"])
    .describe("Controls whitespace and padding"),
});

const BaseSection = z.object({
  heading: z.string().transform(s => s.slice(0, 80)),
  subheading: z.string().transform(s => s.slice(0, 160)).optional(),
  icon: z
    .string()
    .transform(s => s.slice(0, 24))
    .optional()
    .describe(
      "Semantic icon token for this section (e.g. 'money', 'growth', 'people', 'global'). Picked from the provided ICON_TOKENS list. Rendered as a vector icon.",
    ),
  imagePrompt: z
    .string()
    .transform(s => s.slice(0, 400))
    .optional()
    .describe("Short visual prompt for AI image generation"),
  imageUrl: z.string().optional(),
});

const MetricSection = BaseSection.extend({
  type: z.literal("metric"),
  value: z
    .string()
    .describe(
      "The primary number or stat (e.g. '40', '3-6%', '$1.2B'). Keep under ~12 chars; units go in `unit` field.",
    ),
  unit: z.string().optional(),
  trend: z.enum(["up", "down", "neutral"]).optional(),
  insight: z.string().transform(s => s.slice(0, 300)).describe("Briefly explain why this number matters"),
});

const ComparisonSection = BaseSection.extend({
  type: z.literal("comparison"),
  scaleDescription: z
    .string()
    .transform(s => s.slice(0, 120))
    .optional()
    .describe(
      "What the bar represents — e.g. 'Relative speed, higher = faster' or 'Market share %' or 'Score out of 100'",
    ),
  items: z
    .array(
      z.object({
        label: z.string(),
        value: z
          .number()
          .describe(
            "Bar length, 0-100. This is the visual width only — put the real-world figure in valueLabel.",
          ),
        valueLabel: z
          .string()
          .nullable()
          .optional()
          .transform(s => s?.slice(0, 30) ?? undefined)
          .describe(
            "Human-readable value displayed beside the bar — e.g. '60%', '2.3M users', '4.5x faster', '$1.2B'. Falls back to the numeric value if omitted.",
          ),
        isHighlight: z.boolean(),
        icon: z
          .string()
          .transform(s => s.slice(0, 24))
          .optional()
          .describe("Optional semantic icon token for this row (from ICON_TOKENS)"),
        description: z
          .string()
          .transform(s => s.slice(0, 200))
          .optional()
          .describe("One short clause explaining this data point"),
      }),
    )
    .min(2)
    .max(8),
  insight: z
    .string()
    .transform(s => s.slice(0, 400))
    .optional()
    .describe("One sentence summarising what this comparison reveals"),
});

const ChartSection = BaseSection.extend({
  type: z.literal("chart"),
  chartType: z
    .enum(["pie", "donut", "bar", "bubble", "radial", "area"])
    .describe(
      "pie/donut for proportional breakdown; bar for ranked values; bubble for proportional size comparison; radial for ranked progress rings (3-6 items, value 0-100); area for a time-series trend (ordered points)",
    ),
  data: z
    .array(
      z.object({
        label: z.string().transform(s => s.slice(0, 40)),
        value: z.number().describe("Numeric value"),
        valueLabel: z
          .string()
          .nullable()
          .optional()
          .transform(s => s?.slice(0, 30) ?? undefined)
          .describe("Human-readable value (e.g. '42%', '$1.2B')"),
      }),
    )
    .min(2)
    .max(10),
  unit: z
    .string()
    .transform(s => s.slice(0, 40))
    .optional()
    .describe("Unit shown beside numbers in legend/tooltip (e.g. '%', 'M users')"),
  insight: z
    .string()
    .transform(s => s.slice(0, 400))
    .optional()
    .describe("One sentence summarising what the chart reveals"),
});

const KeyTakeawaySection = BaseSection.extend({
  type: z.literal("takeaway"),
  points: z.array(z.string().transform(s => s.slice(0, 200))).min(2).max(8),
  insight: z
    .string()
    .transform(s => s.slice(0, 400))
    .optional()
    .describe("One sentence summarising why these takeaways matter"),
});

export const CalloutSection = BaseSection.extend({
  type: z.literal("callout"),
  quote: z.string().transform(s => s.slice(0, 300)).describe("The striking fact as a complete sentence"),
  stat: z.string().transform(s => s.slice(0, 30)).optional().describe("Key number or figure e.g. '$33.7B', '260M+'"),
  attribution: z.string().transform(s => s.slice(0, 120)).optional().describe("Source context e.g. 'Netflix Q4 2023 earnings'"),
});

export const PictographSection = BaseSection.extend({
  type: z.literal("pictograph"),
  rows: z
    .array(
      z.object({
        label: z.string().transform(s => s.slice(0, 40)).describe("Row label e.g. 'USA', 'Europe', 'Africa'"),
        count: z.number().describe("Number of icons to highlight (can be decimal e.g. 5.4 for 54%)"),
        total: z.number().int().min(2).max(20).describe("Total icons shown in the row"),
        valueLabel: z.string().nullable().optional().transform(s => s?.slice(0, 20) ?? undefined).describe("Human-readable value e.g. '24/week', '54%'"),
      }),
    )
    .min(1)
    .max(6),
  iconLabel: z.string().transform(s => s.slice(0, 80)).optional().describe("What each icon represents e.g. 'cups per week', 'people out of 10'"),
  iconToken: z
    .string()
    .transform(s => s.slice(0, 24))
    .optional()
    .describe(
      "Which glyph to repeat for the icon array (from ICON_TOKENS). e.g. 'coffee' for cups, 'person' for people, 'car' for vehicles. Defaults to a person.",
    ),
  insight: z.string().transform(s => s.slice(0, 400)).optional(),
});

export const InfographicContentSchema = z.object({
  title: z.string().min(1).transform(s => s.slice(0, 120)),
  summary: z
    .string()
    .transform(s => s.slice(0, 400))
    .describe("The 'Too Long; Didn't Read' summary for the header"),
  heroImagePrompt: z
    .string()
    .transform(s => s.slice(0, 400))
    .optional()
    .describe("Visual prompt for a hero image at top of infographic"),
  heroImageUrl: z.string().nullable().optional().transform(v => v ?? undefined),
  sections: z
    .array(
      z.discriminatedUnion("type", [
        MetricSection,
        ComparisonSection,
        ChartSection,
        KeyTakeawaySection,
        CalloutSection,
        PictographSection,
      ]),
    )
    .min(4)
    .max(12),

  metadata: z.object({
    confidenceScore: z.number().min(0).max(1),
    reasoning: z
      .string()
      .describe("Briefly explain why these sections were chosen for this data"),
  }),
});

export const ReviewOutputSchema = z.object({
  isAccurate: z.boolean(),
  feedback: z.string(),
});

export const FinalPayloadSchema = z.object({
  content: InfographicContentSchema,
  style: BrandStyleSchema,
  qaReport: z.any(),
});

// Studio schemas — color palettes & templates

export const COLOR_SCHEME_PRESETS = {
  brand:     { primary: "#121042", accent: "#fdbc2b", secondary: "#f8f7f3", fontMood: "modern-sans" as const },
  editorial: { primary: "#0f172a", accent: "#f59e0b", secondary: "#f8f5ef", fontMood: "modern-sans" as const },
  coral:     { primary: "#9f1239", accent: "#f43f5e", secondary: "#fff1f2", fontMood: "modern-sans" as const },
  coffee:    { primary: "#3b1a08", accent: "#f97316", secondary: "#fdf2e3", fontMood: "slab"        as const },
  ocean:     { primary: "#0c4a6e", accent: "#0ea5e9", secondary: "#e0f2fe", fontMood: "modern-sans" as const },
  forest:    { primary: "#14532d", accent: "#22c55e", secondary: "#f0fdf4", fontMood: "corporate"   as const },
  midnight:  { primary: "#e2e8f0", accent: "#818cf8", secondary: "#0f172a", fontMood: "modern-sans" as const },
  vivid:     { primary: "#ffffff", accent: "#f59e0b", secondary: "#1e1b4b", fontMood: "modern-sans" as const },
} as const;

export type ColorSchemeId = keyof typeof COLOR_SCHEME_PRESETS | "custom";

// Each slot in a template layout
export type SlotColorRole = "primary" | "accent" | "accent-alt" | "surface" | "surface-alt" | "footer";

export type TemplateSectionType = "metric" | "chart" | "comparison" | "takeaway" | "callout" | "pictograph";

export type TemplateSlotDef = {
  regionType: "banner" | "stat" | "chart" | "comparison" | "takeaway" | "callout" | "pictograph" | "footer";
  acceptedTypes: TemplateSectionType[];
  colorRole: SlotColorRole;
};

export type TemplateDef = {
  canvasWidth: number;
  canvasHeight: number;
  gridTemplateAreas: string;
  gridTemplateColumns: string;
  gridTemplateRows: string;
  slots: Record<string, TemplateSlotDef>;
  /** When true, rows size to content and the canvas height is measured at
   *  render time (used for long-form poster layouts to avoid empty space). */
  adaptiveHeight?: boolean;
};

export const TEMPLATE_DEFINITIONS: Record<string, TemplateDef> = {
  "editorial-portrait": {
    canvasWidth: 794, canvasHeight: 1123,
    gridTemplateAreas: `"banner    banner" "stat-a    stat-b" "chart     comparison" "takeaway  takeaway" "footer    footer"`,
    gridTemplateColumns: "1fr 1fr",
    gridTemplateRows: "140px 200px 1fr 290px 50px",
    slots: {
      banner:     { regionType: "banner",     acceptedTypes: [],                                    colorRole: "primary" },
      "stat-a":   { regionType: "stat",       acceptedTypes: ["metric", "callout", "pictograph"],                 colorRole: "accent" },
      "stat-b":   { regionType: "stat",       acceptedTypes: ["metric", "callout", "pictograph"],                 colorRole: "primary" },
      chart:      { regionType: "chart",      acceptedTypes: ["chart", "comparison"],               colorRole: "surface" },
      comparison: { regionType: "comparison", acceptedTypes: ["comparison", "chart"],               colorRole: "surface-alt" },
      takeaway:   { regionType: "takeaway",   acceptedTypes: ["takeaway", "callout", "pictograph"],               colorRole: "surface" },
      footer:     { regionType: "footer",     acceptedTypes: [],                                    colorRole: "footer" },
    },
  },
  "editorial-landscape": {
    canvasWidth: 1123, canvasHeight: 920,
    gridTemplateAreas: `"banner   banner     banner" "stat-a   stat-b     stat-c" "chart    chart      comparison" "takeaway takeaway   takeaway" "footer   footer     footer"`,
    gridTemplateColumns: "1fr 1fr 1fr",
    gridTemplateRows: "140px 200px 1fr 190px 46px",
    slots: {
      banner:     { regionType: "banner",     acceptedTypes: [],                                    colorRole: "primary" },
      "stat-a":   { regionType: "stat",       acceptedTypes: ["metric", "callout", "pictograph"],                 colorRole: "accent" },
      "stat-b":   { regionType: "stat",       acceptedTypes: ["metric", "callout", "pictograph"],                 colorRole: "primary" },
      "stat-c":   { regionType: "stat",       acceptedTypes: ["metric", "callout", "pictograph"],                 colorRole: "accent" },
      chart:      { regionType: "chart",      acceptedTypes: ["chart", "comparison"],               colorRole: "surface" },
      comparison: { regionType: "comparison", acceptedTypes: ["comparison", "chart"],               colorRole: "surface-alt" },
      takeaway:   { regionType: "takeaway",   acceptedTypes: ["takeaway", "callout", "pictograph"],               colorRole: "surface" },
      footer:     { regionType: "footer",     acceptedTypes: [],                                    colorRole: "footer" },
    },
  },
  "social-square": {
    canvasWidth: 1080, canvasHeight: 1080,
    gridTemplateAreas: `"banner   banner" "stat-a   stat-b" "chart    chart" "takeaway footer"`,
    gridTemplateColumns: "1fr 1fr",
    gridTemplateRows: "200px 200px 1fr 100px",
    slots: {
      banner:   { regionType: "banner",     acceptedTypes: [],                                    colorRole: "primary" },
      "stat-a": { regionType: "stat",       acceptedTypes: ["metric", "callout", "pictograph"],                 colorRole: "accent" },
      "stat-b": { regionType: "stat",       acceptedTypes: ["metric", "callout", "pictograph"],                 colorRole: "primary" },
      chart:    { regionType: "chart",      acceptedTypes: ["chart", "comparison"],               colorRole: "surface" },
      takeaway: { regionType: "takeaway",   acceptedTypes: ["takeaway", "callout", "pictograph"],               colorRole: "surface-alt" },
      footer:   { regionType: "footer",     acceptedTypes: [],                                    colorRole: "footer" },
    },
  },
  "social-wide": {
    canvasWidth: 1200, canvasHeight: 628,
    gridTemplateAreas: `"banner   banner   banner" "chart    stat-a   stat-b" "takeaway takeaway takeaway" "footer   footer   footer"`,
    gridTemplateColumns: "1.5fr 1fr 1fr",
    gridTemplateRows: "132px 1fr 118px 34px",
    slots: {
      banner:   { regionType: "banner",     acceptedTypes: [],                                    colorRole: "primary" },
      chart:    { regionType: "chart",      acceptedTypes: ["chart", "comparison"],               colorRole: "surface" },
      "stat-a": { regionType: "stat",       acceptedTypes: ["metric", "callout", "pictograph"],   colorRole: "accent" },
      "stat-b": { regionType: "stat",       acceptedTypes: ["metric", "callout", "pictograph"],   colorRole: "primary" },
      takeaway: { regionType: "takeaway",   acceptedTypes: ["takeaway", "callout", "pictograph"], colorRole: "surface-alt" },
      footer:   { regionType: "footer",     acceptedTypes: [],                                    colorRole: "footer" },
    },
  },
  "poster": {
    canvasWidth: 800, canvasHeight: 1600,
    adaptiveHeight: true,
    gridTemplateAreas: `"banner" "stat-a" "callout" "stat-b" "chart" "comparison" "takeaway" "footer"`,
    gridTemplateColumns: "1fr",
    // Rows size to their content; canvas height is measured at render time.
    gridTemplateRows: "260px minmax(150px,auto) minmax(150px,auto) minmax(150px,auto) minmax(300px,auto) minmax(300px,auto) minmax(220px,auto) 64px",
    slots: {
      banner:     { regionType: "banner",     acceptedTypes: [],                                    colorRole: "primary" },
      "stat-a":   { regionType: "stat",       acceptedTypes: ["metric", "callout", "pictograph"],                 colorRole: "accent" },
      callout:    { regionType: "callout",    acceptedTypes: ["callout", "metric"],                 colorRole: "primary" },
      "stat-b":   { regionType: "stat",       acceptedTypes: ["metric", "callout", "pictograph"],                 colorRole: "accent" },
      chart:      { regionType: "chart",      acceptedTypes: ["chart", "comparison"],               colorRole: "surface" },
      comparison: { regionType: "comparison", acceptedTypes: ["comparison", "chart"],               colorRole: "surface-alt" },
      takeaway:   { regionType: "takeaway",   acceptedTypes: ["takeaway"],                          colorRole: "surface" },
      footer:     { regionType: "footer",     acceptedTypes: [],                                    colorRole: "footer" },
    },
  },
  "sidebar-portrait": {
    canvasWidth: 794, canvasHeight: 1123,
    gridTemplateAreas: `"sidebar banner" "sidebar stat-a" "sidebar chart" "sidebar takeaway" "footer  footer"`,
    gridTemplateColumns: "220px 1fr",
    gridTemplateRows: "140px 200px 1fr 290px 50px",
    slots: {
      sidebar:  { regionType: "stat",       acceptedTypes: ["pictograph", "metric", "callout"],   colorRole: "accent" },
      banner:   { regionType: "banner",     acceptedTypes: [],                                    colorRole: "primary" },
      "stat-a": { regionType: "stat",       acceptedTypes: ["metric", "callout", "pictograph"],   colorRole: "primary" },
      chart:    { regionType: "chart",      acceptedTypes: ["chart", "comparison"],               colorRole: "surface" },
      takeaway: { regionType: "takeaway",   acceptedTypes: ["takeaway", "callout", "pictograph"], colorRole: "surface-alt" },
      footer:   { regionType: "footer",     acceptedTypes: [],                                    colorRole: "footer" },
    },
  },
  "asymmetric-landscape": {
    canvasWidth: 1123, canvasHeight: 794,
    gridTemplateAreas: `"banner   banner     banner" "feature  stat-a     stat-b" "feature  comparison comparison" "feature  takeaway   takeaway" "footer   footer     footer"`,
    gridTemplateColumns: "1.4fr 1fr 1fr",
    gridTemplateRows: "140px 1fr 1fr 200px 46px",
    slots: {
      banner:     { regionType: "banner",     acceptedTypes: [],                                    colorRole: "primary" },
      feature:    { regionType: "chart",      acceptedTypes: ["chart", "comparison"],               colorRole: "surface" },
      "stat-a":   { regionType: "stat",       acceptedTypes: ["metric", "callout", "pictograph"],   colorRole: "accent" },
      "stat-b":   { regionType: "stat",       acceptedTypes: ["metric", "callout", "pictograph"],   colorRole: "primary" },
      comparison: { regionType: "comparison", acceptedTypes: ["comparison", "chart"],               colorRole: "surface-alt" },
      takeaway:   { regionType: "takeaway",   acceptedTypes: ["takeaway", "callout", "pictograph"], colorRole: "surface" },
      footer:     { regionType: "footer",     acceptedTypes: [],                                    colorRole: "footer" },
    },
  },
  "banner-bottom-square": {
    canvasWidth: 1080, canvasHeight: 1080,
    gridTemplateAreas: `"stat-a   stat-b" "chart    chart" "takeaway takeaway" "banner   banner" "footer   footer"`,
    gridTemplateColumns: "1fr 1fr",
    gridTemplateRows: "200px 260px 1fr 180px 40px",
    slots: {
      "stat-a": { regionType: "stat",       acceptedTypes: ["metric", "callout", "pictograph"],   colorRole: "accent" },
      "stat-b": { regionType: "stat",       acceptedTypes: ["metric", "callout", "pictograph"],   colorRole: "primary" },
      chart:    { regionType: "chart",      acceptedTypes: ["chart", "comparison"],               colorRole: "surface" },
      takeaway: { regionType: "takeaway",   acceptedTypes: ["takeaway", "callout", "pictograph"], colorRole: "surface-alt" },
      banner:   { regionType: "banner",     acceptedTypes: [],                                    colorRole: "primary" },
      footer:   { regionType: "footer",     acceptedTypes: [],                                    colorRole: "footer" },
    },
  },
  "magazine-grid": {
    canvasWidth: 1123, canvasHeight: 794,
    gridTemplateAreas: `"banner   banner  banner" "stat-a   chart   stat-b" "takeaway chart   comparison" "footer   footer  footer"`,
    gridTemplateColumns: "1fr 1.3fr 1fr",
    gridTemplateRows: "140px 1fr 1fr 46px",
    slots: {
      banner:     { regionType: "banner",     acceptedTypes: [],                                    colorRole: "primary" },
      "stat-a":   { regionType: "stat",       acceptedTypes: ["metric", "callout", "pictograph"],   colorRole: "accent" },
      chart:      { regionType: "chart",      acceptedTypes: ["chart", "comparison"],               colorRole: "surface" },
      "stat-b":   { regionType: "stat",       acceptedTypes: ["metric", "callout", "pictograph"],   colorRole: "primary" },
      takeaway:   { regionType: "takeaway",   acceptedTypes: ["takeaway", "callout", "pictograph"], colorRole: "surface-alt" },
      comparison: { regionType: "comparison", acceptedTypes: ["comparison", "chart"],               colorRole: "surface" },
      footer:     { regionType: "footer",     acceptedTypes: [],                                    colorRole: "footer" },
    },
  },
};

// Slot assignment: maps slot name → section index (null = no section, e.g. banner/footer)
export const SlotAssignmentSchema = z.object({
  template: z.string(),
  slots: z.record(z.string(), z.number().nullable()),
});

export const StudioInputSchema = InfographicInputSchema.extend({
  generateImages: z.boolean().default(true),
  template: z
    .enum([
      "editorial-portrait",
      "editorial-landscape",
      "social-square",
      "social-wide",
      "poster",
      "sidebar-portrait",
      "asymmetric-landscape",
      "banner-bottom-square",
      "magazine-grid",
    ])
    .default("editorial-portrait"),
  primaryFont: z
    .enum(["condensed-sans", "slab", "modern-sans", "display-serif", "corporate", "playful", "monospaced"])
    .default("modern-sans"),
  accentStyle: z
    .enum(["ribbon", "stamp", "rule", "none"])
    .default("rule"),
  illustrationStyle: z
    .enum(["flat", "editorial", "minimal", "none"])
    .default("flat"),
  showSourceFooter: z.boolean().default(true),
  colorScheme: z
    .enum(["brand", "editorial", "coral", "coffee", "ocean", "forest", "midnight", "vivid", "custom"])
    .default("brand"),
  userPrimary:    z.string().regex(/^#[A-Fa-f0-9]{6}$/).optional(),
  userAccent:     z.string().regex(/^#[A-Fa-f0-9]{6}$/).optional(),
  userBackground: z.string().regex(/^#[A-Fa-f0-9]{6}$/).optional(),
});

// Keep for backward compat (tests reference this)
export const CANVAS_SIZES = {
  "editorial-portrait": { width: 794, height: 1123 },
  "editorial-landscape": { width: 1123, height: 920 },
  "social-square": { width: 1080, height: 1080 },
  "social-wide": { width: 1200, height: 628 },
  "poster": { width: 800, height: 2400 },
} as const;

// Keep for backward compat
export const RegionSchema = z.object({
  id: z.string(),
  type: z.enum(["banner","stat","bar-chart","donut","pictograph","annotated-bar","illustration","takeaway","footer"]),
  x: z.number(), y: z.number(), width: z.number(), height: z.number(),
  sectionIndex: z.number().optional(),
  visualHint: z.string().max(200).optional(),
});

// Keep for backward compat
export const LayoutSpecSchema = z.object({
  canvasWidth: z.number(),
  canvasHeight: z.number(),
  background: z.object({ color: z.string(), pattern: z.enum(["none","dots","grid","diagonal"]).default("none") }),
  regions: z.array(RegionSchema).min(2),
});

export const StudioFinalPayloadSchema = FinalPayloadSchema.extend({
  slotAssignment: SlotAssignmentSchema,
  studioConfig: z.object({
    template: z.string(),
    primaryFont: z.string(),
    accentStyle: z.string(),
    illustrationStyle: z.string(),
    showSourceFooter: z.boolean(),
    colorScheme: z.string(),
    userPrimary:    z.string().optional(),
    userAccent:     z.string().optional(),
    userBackground: z.string().optional(),
  }),
});
