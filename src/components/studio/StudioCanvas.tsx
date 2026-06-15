"use client";

import { forwardRef, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { StudioViewModel } from "../../hooks/useStudioGenerator";
import type { LogoPlacement } from "../../lib/brand-kit";
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

// Parses a `gridTemplateAreas` string ("a a" "b c") into a 2D array of area names.
function parseGridAreas(template: string): string[][] {
  const rows = template.match(/"[^"]*"/g) ?? [];
  return rows.map((r) => r.slice(1, -1).trim().split(/\s+/).filter(Boolean));
}

// Zeroes out the track size for any row/column whose cells are entirely
// empty slots, letting neighboring `1fr` tracks absorb the freed space.
// Falls back to the original tracks if the shape is unexpected or every
// track would collapse (degenerate / fully-empty layout).
function collapseEmptyTracks(
  tracks: string,
  areaGrid: string[][],
  axis: "row" | "col",
  emptyAreas: Set<string>,
): string {
  const sizes = tracks.trim().split(/\s+/);
  const count = axis === "row" ? areaGrid.length : (areaGrid[0]?.length ?? 0);
  if (sizes.length !== count || count === 0) return tracks;

  const collapsible = Array.from({ length: count }, (_, i) => {
    const cells = axis === "row" ? areaGrid[i] : areaGrid.map((row) => row[i]);
    return cells.length > 0 && cells.every((area) => emptyAreas.has(area));
  });

  if (collapsible.every(Boolean) || !collapsible.some(Boolean)) return tracks;

  return sizes.map((size, i) => (collapsible[i] ? "0px" : size)).join(" ");
}

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
      const bg = style.secondaryColor;
      return { bg, text: luminance(bg) > 0.45 ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.45)", accent: style.accentColor };
    }
    case "surface-alt": {
      // Alt cards get a subtle brand-primary tint so they visually separate from plain surface.
      const bg = canvasBgDark ? "rgba(255,255,255,0.18)" : "rgba(18,16,66,0.05)";
      return { bg, text: style.primaryColor, accent: style.accentColor };
    }
    case "surface":
    default: {
      // Light canvas → solid white card for clean contrast against warm beige.
      // Dark canvas → subtle white lift.
      const bg = canvasBgDark ? "rgba(255,255,255,0.12)" : "#ffffff";
      return { bg, text: style.primaryColor, accent: style.accentColor };
    }
  }
}

type Props = {
  data: StudioViewModel;
  displayWidth?: number;
  /** When set, content slots become clickable for the reorder/swap flow. */
  editable?: boolean;
  selectedSlot?: string | null;
  onSlotClick?: (slotName: string) => void;
  /** Brand-kit overrides layered on top of the generated design. */
  logoDataUrl?: string | null;
  logoPlacement?: LogoPlacement;
  footerText?: string | null;
};

export const StudioCanvas = forwardRef<HTMLDivElement, Props>(function StudioCanvas(
  {
    data,
    displayWidth = 640,
    editable = false,
    selectedSlot = null,
    onSlotClick,
    logoDataUrl = null,
    logoPlacement = "none",
    footerText = null,
  },
  ref,
) {
  const bannerLogo = logoDataUrl && logoPlacement.startsWith("banner-") ? logoDataUrl : null;
  const bannerLogoAlign: "left" | "right" = logoPlacement === "banner-left" ? "left" : "right";
  const footerLogo = logoDataUrl && logoPlacement.startsWith("footer-") ? logoDataUrl : null;
  const footerLogoAlign: "left" | "right" = logoPlacement === "footer-left" ? "left" : "right";
  const { title, summary, sections, heroImageUrl, studioConfig, slotAssignment } = data;
  const style = data.style ?? {
    primaryColor: "#0f172a", secondaryColor: "#f8f5ef", accentColor: "#f59e0b",
    fontMood: "modern-sans" as const, borderRadius: "0.5rem", layoutDensity: "airy" as const,
  };

  const templateId = slotAssignment.template;
  const def = TEMPLATE_DEFINITIONS[templateId] ?? TEMPLATE_DEFINITIONS["editorial-portrait"];
  const { canvasWidth, canvasHeight, gridTemplateAreas, gridTemplateColumns, gridTemplateRows, slots } = def;
  const adaptive = def.adaptiveHeight === true;

  // Slots with no assigned section (excluding always-present banner/footer)
  // collapse their row/column track so the empty space doesn't show as a
  // blank gap and neighboring `1fr` tracks expand into it instead.
  const emptySlotAreas = useMemo(() => {
    const set = new Set<string>();
    for (const [slotName, slotDef] of Object.entries(slots)) {
      if (slotDef.regionType === "banner" || slotDef.regionType === "footer") continue;
      const sectionIndex = slotAssignment.slots[slotName] ?? null;
      const section = sectionIndex !== null ? sections[sectionIndex] : null;
      if (!section) set.add(slotName);
    }
    return set;
  }, [slots, slotAssignment, sections]);

  const areaGrid = useMemo(() => parseGridAreas(gridTemplateAreas), [gridTemplateAreas]);
  const effectiveRows = useMemo(
    () => collapseEmptyTracks(gridTemplateRows, areaGrid, "row", emptySlotAreas),
    [gridTemplateRows, areaGrid, emptySlotAreas],
  );
  const effectiveColumns = useMemo(
    () => collapseEmptyTracks(gridTemplateColumns, areaGrid, "col", emptySlotAreas),
    [gridTemplateColumns, areaGrid, emptySlotAreas],
  );

  const scale       = displayWidth / canvasWidth;

  // Adaptive templates (poster) size to content: measure the grid's natural
  // height so the wrapper/export crop exactly to content
  const innerRef = useRef<HTMLDivElement | null>(null);
  const [measuredHeight, setMeasuredHeight] = useState(canvasHeight);
  useLayoutEffect(() => {
    if (!adaptive || !innerRef.current) return;
    const el = innerRef.current;
    const update = () => setMeasuredHeight(el.scrollHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [adaptive, data]);

  const effectiveHeight = adaptive ? measuredHeight : canvasHeight;
  const displayHeight = Math.round(effectiveHeight * scale);
  const fontFamily  = FONT_STACKS[studioConfig.primaryFont] ?? FONT_STACKS["modern-sans"];
  const canvasBg    = style.secondaryColor;
  const canvasBgDark = luminance(canvasBg) < 0.45;
  // Hairline panel separation, like the paneled look of editorial infographics.
  const dividerColor = canvasBgDark ? "rgba(255,255,255,0.10)" : "rgba(18,16,66,0.14)";

  return (
    <div
      style={{ width: displayWidth, height: displayHeight, overflow: "hidden", position: "relative" }}
      className="rounded-2xl shadow-xl"
    >
      {/* Mount-once reveal — settles well before any PNG/PDF export capture. */}
      <style>{`@keyframes studioSlotReveal{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}`}</style>
      <div
        ref={(node) => {
          innerRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }}
        style={{
          width: canvasWidth,
          height: adaptive ? "auto" : canvasHeight,
          display: "grid",
          gridTemplateAreas,
          gridTemplateColumns: effectiveColumns,
          gridTemplateRows: effectiveRows,
          transformOrigin: "top left",
          transform: `scale(${scale})`,
          fontFamily,
          backgroundColor: canvasBg,
          overflow: "hidden",
        }}
      >
        {Object.entries(slots).map(([slotName, slotDef], slotIndex) => {
          const sectionIndex = slotAssignment.slots[slotName] ?? null;
          const section = sectionIndex !== null ? (sections[sectionIndex] ?? null) : null;
          const colors = resolveSlotColors(slotDef.colorRole, style, canvasBgDark);

          const isTextured = slotDef.colorRole === "surface" || slotDef.colorRole === "surface-alt";
          const dotColor = canvasBgDark ? "rgba(255,255,255,0.06)" : "rgba(18,16,66,0.07)";
          const isFooter = slotDef.regionType === "footer";
          const isStructural = slotDef.regionType === "banner" || slotDef.regionType === "footer";
          // A content slot left unassigned (e.g. after a layout switch that
          // couldn't fit every section) — blend it into the canvas instead of
          // showing a stray colored block with nothing in it.
          const isEmpty = !isStructural && !section;
          const isSelected = editable && selectedSlot === slotName;
          const isClickable = editable && !isStructural && !!section;

          const slotStyle: React.CSSProperties = {
            gridArea: slotName,
            backgroundColor: isEmpty ? canvasBg : colors.bg,
            ...(isTextured && !isEmpty ? {
              backgroundImage: `radial-gradient(circle, ${dotColor} 1px, transparent 1px)`,
              backgroundSize: "16px 16px",
            } : {}),
            overflow: "hidden",
            position: "relative",
            minWidth: 0,
            minHeight: 0,
            boxShadow: isSelected
              ? `inset 0 0 0 2.5px var(--primary)`
              : isFooter || isEmpty ? undefined : `inset 0 0 0 1px ${dividerColor}`,
            cursor: isClickable ? "pointer" : undefined,
            animation: `studioSlotReveal 0.5s ease-out ${slotIndex * 0.06}s both`,
            containerType: "inline-size" as React.CSSProperties["containerType"],
          };

          const regionProps = {
            primaryColor: colors.text,
            accentColor: colors.accent,
            bgColor: colors.bg,
            width: 0, height: 0,
            fill: true as const,
          };

          let regionNode: React.ReactNode = null;

          if (slotDef.regionType === "banner") {
            regionNode = (
              <BannerRegion
                title={title}
                summary={summary}
                heroImageUrl={heroImageUrl}
                accentStyle={studioConfig.accentStyle}
                primaryColor={style.primaryColor}
                accentColor={style.accentColor}
                width={0} height={0}
                fill
                logoDataUrl={bannerLogo}
                logoAlign={bannerLogoAlign}
              />
            );
          } else if (slotDef.regionType === "footer") {
            regionNode = (
              <FooterRegion
                primaryColor={colors.text}
                accentColor={style.accentColor}
                width={0} height={0}
                fill
                logoDataUrl={footerLogo}
                logoAlign={footerLogoAlign}
                footerText={footerText}
              />
            );
          } else if (section) {
            const isStatLike = slotDef.regionType === "stat" || slotDef.regionType === "callout" || slotDef.regionType === "pictograph";
            const isChartSlot = slotDef.regionType === "chart" && (section.type === "chart" || section.type === "comparison");
            const isComparisonSlot = slotDef.regionType === "comparison" && (section.type === "comparison" || section.type === "chart");
            const isTakeawaySlot = slotDef.regionType === "takeaway";

            if ((isStatLike || isTakeawaySlot) && section.type === "callout") {
              regionNode = <CalloutRegion section={section} {...regionProps} />;
            } else if (isStatLike && section.type === "metric") {
              regionNode = <StatRegion section={section} {...regionProps} />;
            } else if ((isStatLike || isTakeawaySlot) && section.type === "pictograph") {
              regionNode = <PictographRegion section={section} {...regionProps} />;
            } else if ((isChartSlot || isComparisonSlot) && section.type === "chart") {
              regionNode = <ChartRegion section={section} secondaryColor={style.secondaryColor} {...regionProps} />;
            } else if ((isChartSlot || isComparisonSlot) && section.type === "comparison") {
              regionNode = <ComparisonRegion section={section} {...regionProps} />;
            } else if (isTakeawaySlot && section.type === "takeaway") {
              regionNode = <TakeawayRegion section={section} {...regionProps} />;
            }
          }

          return (
            <div
              key={slotName}
              style={slotStyle}
              onClick={isClickable ? () => onSlotClick?.(slotName) : undefined}
              role={isClickable ? "button" : undefined}
              tabIndex={isClickable ? 0 : undefined}
              aria-pressed={isClickable ? isSelected : undefined}
              aria-label={isClickable ? `${slotName.replace("-", " ")} — ${section?.type} section. Click to select for swap.` : undefined}
              onKeyDown={
                isClickable
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSlotClick?.(slotName);
                      }
                    }
                  : undefined
              }
            >
              {regionNode}
              {isClickable && (
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    inset: 0,
                    backgroundColor: isSelected ? "rgba(18,16,66,0.08)" : "transparent",
                    transition: "background-color 0.15s ease",
                    pointerEvents: "none",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});
