/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";

export default function Infographic({ data }: { data: any }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || !data.sections) return null;

  const theme = {
    primary: data.style?.primaryColor || "#111827",
    secondary: data.style?.secondaryColor || "#4B5563",
    accent: data.style?.accentColor || "#2563eb",
    radius: data.style?.borderRadius || "1.5rem",
  };

  return (
    <div
      className="max-w-4xl mx-auto mt-12 p-8 md:p-12 rounded-[2rem]"
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
        style={{ borderColor: theme.primary }}
      >
        <h1
          className="text-4xl md:text-5xl font-black uppercase tracking-tight"
          style={{
            color: theme.primary,
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
                  ? `2px solid ${theme.primary}55`
                  : `1px solid ${theme.secondary}33`,
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
              style={{
                color: hoveredIndex === idx ? theme.primary : theme.secondary,
              }}
            >
              {section.heading}
            </h3>

            {section.type === "metric" && (
              <div className="flex flex-col h-full justify-center gap-4">
                <div className="flex items-baseline gap-3 mb-3">
                  <span
                    className="text-5xl md:text-6xl font-black tracking-tighter transition-colors duration-300"
                    style={{
                      color:
                        hoveredIndex === idx ? theme.accent : theme.primary,
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
                        hoveredIndex === idx ? `translateX(4px)` : "none",
                    }}
                  >
                    <span
                      className="w-2.5 h-2.5 mt-2 rounded-full flex-shrink-0 transition-transform duration-300"
                      style={{
                        backgroundColor:
                          hoveredIndex === idx ? theme.primary : theme.accent,
                        transform:
                          hoveredIndex === idx ? "scale(1.3)" : "scale(1)",
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
                            : theme.secondary,
                        }}
                      >
                        {item.value}
                      </span>
                    </div>
                    <div
                      className="w-full rounded-full h-2.5 overflow-hidden transition-all duration-300"
                      style={{
                        backgroundColor: "var(--border)",
                      }}
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
