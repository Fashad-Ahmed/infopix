import { COLOR_SCHEME_PRESETS } from "../../mastra/schemas/schema";

export const SCHEME_META: Array<{ id: keyof typeof COLOR_SCHEME_PRESETS; label: string }> = [
  { id: "brand",     label: "Brand" },
  { id: "editorial", label: "Editorial" },
  { id: "coral",     label: "Coral" },
  { id: "coffee",    label: "Coffee" },
  { id: "ocean",     label: "Ocean" },
  { id: "forest",    label: "Forest" },
  { id: "midnight",  label: "Midnight" },
  { id: "vivid",     label: "Vivid" },
];

export const INPUT_STYLE = {
  backgroundColor: "var(--surface-alt)",
  border: "1px solid var(--border)",
  color: "var(--foreground)",
  borderRadius: "0.875rem",
  padding: "0.875rem 1.25rem",
  fontSize: "0.9rem",
  width: "100%",
  outline: "none",
  transition: "border-color 0.15s, box-shadow 0.15s",
} as const;
