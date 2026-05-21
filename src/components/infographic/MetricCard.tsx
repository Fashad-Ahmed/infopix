import type { MetricSection } from "../../types/infographic";
import type { InfographicTheme } from "../../lib/infographic-theme";

function metricFontSize(value: string): string {
  const len = value.length;
  if (len <= 4) return "clamp(2.5rem, 5vw, 3.75rem)";
  if (len <= 8) return "clamp(2rem, 4vw, 2.75rem)";
  if (len <= 14) return "clamp(1.5rem, 3vw, 2rem)";
  return "clamp(1.125rem, 2.5vw, 1.5rem)";
}

type MetricCardProps = {
  section: MetricSection;
  theme: InfographicTheme;
  isDark: boolean;
  isHovered: boolean;
};

export function MetricCard({
  section,
  theme,
  isDark,
  isHovered,
}: MetricCardProps) {
  const valueColor = isHovered
    ? theme.accent
    : isDark
      ? theme.metric
      : theme.primary;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-3 min-w-0">
        <span
          className="infographic-metric-value font-black tracking-tight transition-colors duration-300"
          style={{
            color: valueColor,
            fontSize: metricFontSize(String(section.value ?? "")),
            lineHeight: 1.1,
            wordBreak: "break-word",
            maxWidth: "100%",
          }}
        >
          {section.value}
        </span>
        {section.unit && (
          <span
            className="text-lg md:text-xl font-bold transition-colors duration-300"
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
  );
}
