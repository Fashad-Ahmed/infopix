"use client";

import { forwardRef } from "react";
import type { StudioViewModel } from "../../hooks/useStudioGenerator";
import type { SlotColorRole } from "../../mastra/schemas/schema";
import { TEMPLATE_DEFINITIONS } from "../../mastra/schemas/schema";
import { BannerRegion } from "./regions/BannerRegion";
import { StatRegion } from "./regions/StatRegion";
import { ChartRegion } from "./regions/ChartRegion";
import { ComparisonRegion } from "./regions/ComparisonRegion";
import { TakeawayRegion } from "./regions/TakeawayRegion";
import { CalloutRegion } from "./regions/CalloutRegion";
import { PictographRegion } from "./regions/PictographRegion";
import { FooterRegion } from "./regions/FooterRegion";

const FONT_STACKS: Record<string, string> = {
  "condensed-sans": '"Arial Narrow", "Franklin Gothic Medium", "Trebuchet MS", sans-serif',
  "modern-sans":    'Inter, "Helvetica Neue", Arial, sans-serif',
  "slab":           '"Rockwell", "Courier New", Georgia, serif',
  "display-serif":  'Georgia, "Garamond", "Times New Roman", serif',
};

export function luminance(hex: string): number {
  const h = (hex || "#ffffff").replace("#", "").padEnd(6, "f");
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function resolveSlotColors(
  role: SlotColorRole,
  style: { primaryColor: string; secondaryColor: string; accentColor: string },
  canvasBgDark: boolean,
): { bg: string; text: string; accent: string } {
  switch (role) {
    case "primary": {
      const bg = style.primaryColor;
      return { bg, text: luminance(bg) > 0.45 ? "#111111" : "#ffffff", accent: style.accentColor };
    }
    case "accent": {
      const bg = style.accentColor;
      return { bg, text: luminance(bg) > 0.45 ? "#111111" : "#ffffff", accent: style.primaryColor };
    }
    case "accent-alt": {
      // Slightly lighter/darker variant of accent
      const bg = style.accentColor;
      return { bg, text: luminance(bg) > 0.45 ? "#111111" : "#ffffff", accent: style.primaryColor };
    }
    case "footer": {
      const bg = style.primaryColor;
      return { bg, text: luminance(bg) > 0.45 ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.55)", accent: style.accentColor };
    }
    case "surface-alt":
    case "surface":
    default: {
      // Cards need visual weight to stand apart from canvas background.
      // Light canvas → near-solid white card. Dark canvas → subtle white lift.
      const subtleBg = canvasBgDark ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.88)";
      return {
        bg: subtleBg,
        text: canvasBgDark ? style.primaryColor : style.primaryColor,
        accent: style.accentColor,
      };
    }
  }
}

type Props = {
  data: StudioViewModel;
  displayWidth?: number;
};

export const StudioCanvas = forwardRef<HTMLDivElement, Props>(function StudioCanvas(
  { data, displayWidth = 640 },
  ref,
) {
  const { title, summary, sections, heroImageUrl, studioConfig, slotAssignment } = data;
  const style = data.style ?? {
    primaryColor: "#0f172a", secondaryColor: "#f8f5ef", accentColor: "#f59e0b",
    fontMood: "modern-sans" as const, borderRadius: "0.5rem", layoutDensity: "airy" as const,
  };

  const templateId = slotAssignment.template;
  const def = TEMPLATE_DEFINITIONS[templateId] ?? TEMPLATE_DEFINITIONS["editorial-portrait"];
  const { canvasWidth, canvasHeight, gridTemplateAreas, gridTemplateColumns, gridTemplateRows, slots } = def;

  const scale       = displayWidth / canvasWidth;
  const displayHeight = Math.round(canvasHeight * scale);
  const fontFamily  = FONT_STACKS[studioConfig.primaryFont] ?? FONT_STACKS["modern-sans"];
  const canvasBg    = style.secondaryColor;
  const canvasBgDark = luminance(canvasBg) < 0.45;

  return (
    <div
      style={{ width: displayWidth, height: displayHeight, overflow: "hidden", position: "relative" }}
      className="rounded-2xl shadow-xl"
    >
      <div
        ref={ref}
        style={{
          width: canvasWidth,
          height: canvasHeight,
          display: "grid",
          gridTemplateAreas,
          gridTemplateColumns,
          gridTemplateRows,
          transformOrigin: "top left",
          transform: `scale(${scale})`,
          fontFamily,
          backgroundColor: canvasBg,
        }}
      >
        {Object.entries(slots).map(([slotName, slotDef]) => {
          const sectionIndex = slotAssignment.slots[slotName] ?? null;
          const section = sectionIndex !== null ? (sections[sectionIndex] ?? null) : null;
          const colors = resolveSlotColors(slotDef.colorRole, style, canvasBgDark);

          const isTextured = slotDef.colorRole === "surface" || slotDef.colorRole === "surface-alt";
          const dotColor = canvasBgDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.045)";
          const slotStyle: React.CSSProperties = {
            gridArea: slotName,
            backgroundColor: colors.bg,
            ...(isTextured ? {
              backgroundImage: `radial-gradient(circle, ${dotColor} 1px, transparent 1px)`,
              backgroundSize: "16px 16px",
            } : {}),
            overflow: "hidden",
            position: "relative",
            minWidth: 0,
            minHeight: 0,
            containerType: "inline-size" as React.CSSProperties["containerType"],
          };

          // Banner
          if (slotDef.regionType === "banner") {
            return (
              <div key={slotName} style={slotStyle}>
                <BannerRegion
                  title={title}
                  summary={summary}
                  heroImageUrl={heroImageUrl}
                  accentStyle={studioConfig.accentStyle}
                  primaryColor={style.primaryColor}
                  accentColor={style.accentColor}
                  width={0} height={0}
                  fill
                />
              </div>
            );
          }

          // Footer
          if (slotDef.regionType === "footer") {
            return (
              <div key={slotName} style={slotStyle}>
                <FooterRegion
                  primaryColor={colors.text}
                  accentColor={style.accentColor}
                  width={0} height={0}
                  fill
                />
              </div>
            );
          }

          // Content regions require a matching section
          if (!section) {
            return (
              <div key={slotName} style={{ ...slotStyle, backgroundColor: colors.bg }} />
            );
          }

          if (slotDef.regionType === "stat" || slotDef.regionType === "callout" || slotDef.regionType === "pictograph") {
            if (section.type === "callout") {
              return (
                <div key={slotName} style={slotStyle}>
                  <CalloutRegion
                    section={section}
                    primaryColor={colors.text}
                    accentColor={colors.accent}
                    bgColor={colors.bg}
                    width={0} height={0}
                    fill
                  />
                </div>
              );
            }
            if (section.type === "metric") {
              return (
                <div key={slotName} style={slotStyle}>
                  <StatRegion
                    section={section}
                    primaryColor={colors.text}
                    accentColor={colors.accent}
                    bgColor={colors.bg}
                    width={0} height={0}
                    fill
                  />
                </div>
              );
            }
            if (section.type === "pictograph") {
              return (
                <div key={slotName} style={slotStyle}>
                  <PictographRegion
                    section={section}
                    primaryColor={colors.text}
                    accentColor={colors.accent}
                    bgColor={colors.bg}
                    width={0} height={0}
                    fill
                  />
                </div>
              );
            }
          }

          if (slotDef.regionType === "chart" && (section.type === "chart" || section.type === "comparison")) {
            if (section.type === "chart") {
              return (
                <div key={slotName} style={slotStyle}>
                  <ChartRegion
                    section={section}
                    primaryColor={colors.text}
                    secondaryColor={style.secondaryColor}
                    accentColor={colors.accent}
                    bgColor={colors.bg}
                    width={0} height={0}
                    fill
                  />
                </div>
              );
            }
            return (
              <div key={slotName} style={slotStyle}>
                <ComparisonRegion
                  section={section}
                  primaryColor={colors.text}
                  accentColor={colors.accent}
                  bgColor={colors.bg}
                  width={0} height={0}
                  fill
                />
              </div>
            );
          }

          if (slotDef.regionType === "comparison" && (section.type === "comparison" || section.type === "chart")) {
            if (section.type === "comparison") {
              return (
                <div key={slotName} style={slotStyle}>
                  <ComparisonRegion
                    section={section}
                    primaryColor={colors.text}
                    accentColor={colors.accent}
                    bgColor={colors.bg}
                    width={0} height={0}
                    fill
                  />
                </div>
              );
            }
            return (
              <div key={slotName} style={slotStyle}>
                <ChartRegion
                  section={section}
                  primaryColor={colors.text}
                  secondaryColor={style.secondaryColor}
                  accentColor={colors.accent}
                  bgColor={colors.bg}
                  width={0} height={0}
                  fill
                />
              </div>
            );
          }

          if (slotDef.regionType === "takeaway") {
            if (section.type === "takeaway") {
              return (
                <div key={slotName} style={slotStyle}>
                  <TakeawayRegion
                    section={section}
                    primaryColor={colors.text}
                    accentColor={colors.accent}
                    bgColor={colors.bg}
                    width={0} height={0}
                    fill
                  />
                </div>
              );
            }
            if (section.type === "callout") {
              return (
                <div key={slotName} style={slotStyle}>
                  <CalloutRegion
                    section={section}
                    primaryColor={colors.text}
                    accentColor={colors.accent}
                    bgColor={colors.bg}
                    width={0} height={0}
                    fill
                  />
                </div>
              );
            }
            if (section.type === "pictograph") {
              return (
                <div key={slotName} style={slotStyle}>
                  <PictographRegion
                    section={section}
                    primaryColor={colors.text}
                    accentColor={colors.accent}
                    bgColor={colors.bg}
                    width={0} height={0}
                    fill
                  />
                </div>
              );
            }
          }

          // Type mismatch fallback
          return <div key={slotName} style={slotStyle} />;
        })}
      </div>
    </div>
  );
});
