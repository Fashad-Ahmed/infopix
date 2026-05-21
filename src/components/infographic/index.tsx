"use client";

import { forwardRef, useEffect, useMemo, useState } from "react";
import { buildInfographicTheme } from "../../lib/infographic-theme";
import type {
  InfographicSection,
  InfographicViewModel,
} from "../../types/infographic";
import { ChartCard } from "./ChartCard";
import { ComparisonCard } from "./ComparisonCard";
import { MetricCard } from "./MetricCard";
import { SectionImage } from "./SectionImage";
import { TakeawayCard } from "./TakeawayCard";

type InfographicProps = {
  data: InfographicViewModel;
  /** When omitted, follows `html.dark` (synced with app theme toggle). */
  isDark?: boolean;
};

function readDocumentDark(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("dark");
}

const Infographic = forwardRef<HTMLDivElement, InfographicProps>(
  function Infographic({ data, isDark: isDarkProp }, ref) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [isDark, setIsDark] = useState(isDarkProp ?? false);

    useEffect(() => {
      if (isDarkProp !== undefined) {
        setIsDark(isDarkProp);
        return;
      }
      const sync = () => setIsDark(readDocumentDark());
      sync();
      const observer = new MutationObserver(sync);
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      });
      return () => observer.disconnect();
    }, [isDarkProp]);

    const theme = useMemo(
      () => buildInfographicTheme(data?.style, isDark),
      [data?.style, isDark],
    );

    if (!data?.sections) return null;

    const sectionHeadingColor = (active: boolean) =>
      active
        ? isDark
          ? "var(--primary)"
          : theme.primary
        : theme.secondary;

    return (
      <div
        ref={ref}
        className="infographic max-w-4xl mx-auto mt-12 p-8 md:p-12 rounded-4xl"
        data-theme={isDark ? "dark" : "light"}
        style={{
          borderRadius: theme.radius,
          backgroundColor: "var(--surface)",
          border: "1px solid var(--border)",
          boxShadow: "var(--card-shadow)",
          animation: "slideInUp 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {data.heroImageUrl && (
          <div
            className="mb-10 overflow-hidden"
            style={{ borderRadius: theme.radius }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.heroImageUrl}
              alt={data.title}
              crossOrigin="anonymous"
              className="w-full h-64 md:h-80 object-cover"
            />
          </div>
        )}

        <header
          className="mb-12 border-b-4 pb-8"
          style={{
            borderColor: isDark ? "var(--border-strong)" : theme.primary,
          }}
        >
          <h1
            className="text-4xl md:text-5xl font-black uppercase tracking-tight"
            style={{
              color: isDark ? "var(--foreground)" : theme.primary,
              animation: "slideInUp 0.6s ease-out 0.1s backwards",
            }}
          >
            {data.title}
          </h1>
          <p
            className="text-xl mt-4 font-medium leading-relaxed"
            style={{
              color: "var(--muted)",
              animation: "slideInUp 0.6s ease-out 0.2s backwards",
            }}
          >
            {data.summary}
          </p>
        </header>

        <div className="columns-1 md:columns-2 gap-8 [column-fill:balance]">
          {data.sections.map((section, idx) => {
            const isHovered = hoveredIndex === idx;
            return (
              <div
                key={idx}
                className="p-6 mb-8 break-inside-avoid transition-all duration-300 ease-out cursor-pointer overflow-hidden"
                style={{
                  borderRadius: theme.radius,
                  backgroundColor: isHovered
                    ? "var(--card-hover-tint)"
                    : "var(--surface-alt)",
                  border: isHovered
                    ? `2px solid ${isDark ? "var(--border-strong)" : `${theme.primary}55`}`
                    : "1px solid var(--border)",
                  transform: isHovered ? "translateY(-4px) scale(1.02)" : "none",
                  boxShadow: isHovered ? "var(--card-hover-shadow)" : "none",
                  animation: `slideInUp 0.5s ease-out ${0.1 + idx * 0.1}s backwards`,
                }}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <SectionImage
                  src={section.imageUrl}
                  alt={section.heading}
                  radius={theme.radius}
                />

                <h3
                  className="text-sm font-bold uppercase tracking-widest mb-6 transition-colors duration-300"
                  style={{ color: sectionHeadingColor(isHovered) }}
                >
                  {section.heading}
                </h3>

                <SectionBody
                  section={section}
                  theme={theme}
                  isDark={isDark}
                  isHovered={isHovered}
                />

                {section.subheading && (
                  <p
                    className="mt-6 pt-4 border-t text-xs font-bold uppercase tracking-wider transition-colors duration-300"
                    style={{
                      borderColor: "var(--border)",
                      color: "var(--muted)",
                    }}
                  >
                    {section.subheading}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  },
);

type SectionBodyProps = {
  section: InfographicSection;
  theme: ReturnType<typeof buildInfographicTheme>;
  isDark: boolean;
  isHovered: boolean;
};

function SectionBody({ section, theme, isDark, isHovered }: SectionBodyProps) {
  switch (section.type) {
    case "metric":
      return (
        <MetricCard
          section={section}
          theme={theme}
          isDark={isDark}
          isHovered={isHovered}
        />
      );
    case "comparison":
      return (
        <ComparisonCard section={section} theme={theme} isDark={isDark} />
      );
    case "chart":
      return <ChartCard section={section} theme={theme} />;
    case "takeaway":
      return <TakeawayCard section={section} theme={theme} isHovered={isHovered} />;
    default:
      return null;
  }
}

export default Infographic;
export { Infographic };
