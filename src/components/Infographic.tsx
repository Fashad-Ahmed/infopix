/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";

export default function Infographic({ data }: { data: any }) {
  if (!data || !data.sections) return null;

  const theme = {
    primary: data.style?.primaryColor || "#111827", 
    secondary: data.style?.secondaryColor || "#4B5563",
    accent: data.style?.accentColor || "#2563EB", 
    radius: data.style?.borderRadius || "12px",
  };

  return (
    <div
      className="max-w-4xl mx-auto mt-12 p-8 md:p-12 bg-white shadow-2xl border border-gray-100"
      style={{ borderRadius: theme.radius }}
    >
      <header
        className="mb-12 border-b-4 pb-8"
        style={{ borderColor: theme.primary }}
      >
        <h1
          className="text-4xl md:text-5xl font-black uppercase tracking-tight"
          style={{ color: theme.primary }}
        >
          {data.title}
        </h1>
        <p className="text-xl mt-4 text-gray-600 font-medium leading-relaxed">
          {data.summary}
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {data.sections.map((section: any, idx: number) => (
          <div
            key={idx}
            className="p-6 bg-gray-50 border transition-all hover:shadow-md"
            style={{
              borderRadius: theme.radius,
              borderColor: `${theme.secondary}20`,
            }}
          >
            <h3
              className="text-sm font-bold uppercase tracking-widest mb-6"
              style={{ color: theme.secondary }}
            >
              {section.heading}
            </h3>

            {section.type === "metric" && (
              <div className="flex flex-col h-full justify-center">
                <div className="flex items-baseline gap-2 mb-3">
                  <span
                    className="text-6xl font-black tracking-tighter"
                    style={{ color: theme.primary }}
                  >
                    {section.value}
                  </span>
                  {section.unit && (
                    <span className="text-2xl font-bold text-gray-400">
                      {section.unit}
                    </span>
                  )}
                </div>
                <p className="text-gray-700 font-medium leading-snug">
                  {section.insight}
                </p>
              </div>
            )}

            {section.type === "takeaway" && (
              <ul className="space-y-4">
                {section.points?.map((point: string, i: number) => (
                  <li key={i} className="flex gap-4 items-start">
                    <span
                      className="w-2.5 h-2.5 mt-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: theme.accent }}
                    />
                    <span className="text-gray-800 leading-relaxed">
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
                      <span className="font-bold text-gray-700">
                        {item.label}
                      </span>
                      <span
                        className="font-bold"
                        style={{
                          color: item.isHighlight
                            ? theme.accent
                            : theme.secondary,
                        }}
                      >
                        {item.value}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
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
              <p className="mt-6 pt-4 border-t border-gray-200 text-xs font-bold text-gray-400 uppercase tracking-wider">
                {section.subheading}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
