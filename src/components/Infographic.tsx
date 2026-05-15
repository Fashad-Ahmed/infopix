/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { buildInfographicTheme } from "../lib/infographic-theme";

type InfographicProps = {
  data: any;
  /** When omitted, follows `html.dark` (synced with app theme toggle). */
  isDark?: boolean;
};

function readDocumentDark(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("dark");
}

export default function Infographic({ data, isDark: isDarkProp }: InfographicProps) {
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

  if (!data || !data.sections) return null;

  const sectionHeadingColor = (active: boolean) => {
    if (active) return isDark ? "var(--primary)" : theme.primary;
    return theme.secondary;
  };

  return (
    <div
      className="infographic max-w-4xl mx-auto mt-12 p-8 md:p-12 rounded-[2rem]"
      data-theme={isDark ? "dark" : "light"}
      style={{
        borderRadius: theme.radius,
        backgroundColor: "var(--surface)",
        border: "1px solid var(--border)",
        boxShadow: "var(--card-shadow)",
        animation: "slideInUp 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <header
        className="mb-12 border-b-4 pb-8"
        style={{ borderColor: isDark ? "var(--border-strong)" : theme.primary }}
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {data.sections.map((section: any, idx: number) => (
          <div
            key={idx}
            className="p-6 transition-all duration-300 ease-out cursor-pointer"
            style={{
              borderRadius: theme.radius,
              backgroundColor:
                hoveredIndex === idx
                  ? "var(--card-hover-tint)"
                  : "var(--surface-alt)",
              border:
                hoveredIndex === idx
                  ? `2px solid ${isDark ? "var(--border-strong)" : `${theme.primary}55`}`
                  : "1px solid var(--border)",
              transform:
                hoveredIndex === idx ? "translateY(-4px) scale(1.02)" : "none",
              boxShadow:
                hoveredIndex === idx ? "var(--card-hover-shadow)" : "none",
              animation: `slideInUp 0.5s ease-out ${0.1 + idx * 0.1}s backwards`,
            }}
            onMouseEnter={() => setHoveredIndex(idx)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <h3
              className="text-sm font-bold uppercase tracking-widest mb-6 transition-colors duration-300"
              style={{ color: sectionHeadingColor(hoveredIndex === idx) }}
            >
              {section.heading}
            </h3>

            {section.type === "metric" && (
              <div className="flex flex-col h-full justify-center gap-4">
                <div className="flex items-baseline gap-3 mb-3">
                  <span
                    className="infographic-metric-value text-5xl md:text-6xl font-black tracking-tighter transition-colors duration-300"
                    style={{
                      color:
                        hoveredIndex === idx
                          ? theme.accent
                          : isDark
                            ? theme.metric
                            : theme.primary,
                    }}
                  >
                    {section.value}
                  </span>
                  {section.unit && (
                    <span
                      className="text-2xl font-bold transition-colors duration-300"
                      style={{ color: "var(--muted)" }}
                    >
                      {section.unit}
                    </span>
                  )}
                </div>
                <p
                  className="font-medium leading-relaxed"
                  style={{ color: "var(--foreground)" }}
                >
                  {section.insight}
                </p>
              </div>
            )}

            {section.type === "takeaway" && (
              <ul className="space-y-4">
                {section.points?.map((point: string, i: number) => (
                  <li
                    key={i}
                    className="flex gap-4 items-start transition-all duration-300"
                    style={{
                      transform:
                        hoveredIndex === idx ? "translateX(4px)" : "none",
                    }}
                  >
                    <span
                      className="w-2.5 h-2.5 mt-2 rounded-full shrink-0 transition-transform duration-300"
                      style={{
                        backgroundColor:
                          hoveredIndex === idx ? theme.primary : theme.accent,
                      }}
                    />
                    <span
                      className="leading-relaxed"
                      style={{ color: "var(--foreground)" }}
                    >
                      {point}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {section.type === "comparison" && (
              <div className="space-y-5 mt-2">
                {section.items?.map((item: any, i: number) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-2">
                      <span
                        className="font-bold transition-colors duration-300"
                        style={{ color: "var(--foreground)" }}
                      >
                        {item.label}
                      </span>
                      <span
                        className="font-bold transition-colors duration-300"
                        style={{
                          color: item.isHighlight
                            ? theme.accent
                            : isDark
                              ? "var(--muted)"
                              : theme.secondary,
                        }}
                      >
                        {item.value}
                      </span>
                    </div>
                    <div
                      className="w-full rounded-full h-2.5 overflow-hidden transition-all duration-300"
                      style={{ backgroundColor: "var(--border)" }}
                    >
                      <div
                        className="h-full transition-all duration-1000 ease-out"
                        style={{
                          width: `${Math.min((item.value / 100) * 100, 100)}%`,
                          backgroundColor: item.isHighlight
                            ? theme.accent
                            : theme.secondary,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

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
        ))}
      </div>
    </div>
  );
}
