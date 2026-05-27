"use client";

import type { LayoutSpec } from "../../types/infographic";

const REGION_COLORS: Record<string, string> = {
  banner: "#3b82f6",
  stat: "#f59e0b",
  "bar-chart": "#10b981",
  "annotated-bar": "#10b981",
  donut: "#8b5cf6",
  takeaway: "#6b7280",
  footer: "#374151",
  illustration: "#ec4899",
  pictograph: "#f97316",
  "word-weight": "#14b8a6",
  "bubble": "#a855f7",
};

type Props = {
  spec: LayoutSpec;
  /** Rendered width in pixels; height is computed proportionally. Defaults to 280. */
  displayWidth?: number;
};

export function LayoutWireframe({ spec, displayWidth = 280 }: Props) {
  const scale = displayWidth / spec.canvasWidth;
  const displayHeight = Math.round(spec.canvasHeight * scale);

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--muted)" }}>
        Layout plan — {spec.canvasWidth} × {spec.canvasHeight}px
      </p>
      <svg
        width={displayWidth}
        height={displayHeight}
        style={{
          borderRadius: "0.75rem",
          border: "1px solid var(--border)",
          background: spec.background.color,
          display: "block",
        }}
        aria-label="Infographic layout wireframe"
      >
        {spec.regions.map((region) => {
          const color = REGION_COLORS[region.type] ?? "#9ca3af";
          const rx = region.x * scale;
          const ry = region.y * scale;
          const rw = region.width * scale;
          const rh = region.height * scale;
          const fontSize = Math.max(7, Math.min(11, rh / 2.5));
          return (
            <g key={region.id}>
              <rect
                x={rx + 1}
                y={ry + 1}
                width={Math.max(0, rw - 2)}
                height={Math.max(0, rh - 2)}
                rx={3}
                fill={color}
                fillOpacity={0.18}
                stroke={color}
                strokeWidth={1.5}
              />
              {rh * scale > 16 && (
                <text
                  x={rx + rw / 2}
                  y={ry + rh / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={fontSize}
                  fontWeight="600"
                  fill={color}
                  style={{ fontFamily: "system-ui, sans-serif" }}
                >
                  {region.type}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <div className="flex flex-wrap gap-2 mt-3">
        {Array.from(new Set(spec.regions.map((r) => r.type))).map((type) => (
          <span
            key={type}
            className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: `${REGION_COLORS[type] ?? "#9ca3af"}22`,
              color: REGION_COLORS[type] ?? "#9ca3af",
              border: `1px solid ${REGION_COLORS[type] ?? "#9ca3af"}44`,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: REGION_COLORS[type] ?? "#9ca3af" }}
            />
            {type}
          </span>
        ))}
      </div>
    </div>
  );
}
