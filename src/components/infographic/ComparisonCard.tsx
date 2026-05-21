import type { ComparisonSection } from "../../types/infographic";
import type { InfographicTheme } from "../../lib/infographic-theme";
import { InsightCaption } from "./InsightCaption";

type ComparisonCardProps = {
  section: ComparisonSection;
  theme: InfographicTheme;
  isDark: boolean;
};

export function ComparisonCard({
  section,
  theme,
  isDark,
}: ComparisonCardProps) {
  return (
    <div className="flex flex-col gap-4">
      {section.scaleDescription && (
        <p
          className="text-xs font-semibold uppercase tracking-wider -mt-3"
          style={{ color: "var(--muted)" }}
        >
          {section.scaleDescription}
        </p>
      )}

      <div className="space-y-5 mt-2">
        {section.items?.map((item, i) => {
          const valueColor = item.isHighlight
            ? theme.accent
            : isDark
              ? "var(--muted)"
              : theme.secondary;
          const barColor = item.isHighlight ? theme.accent : theme.secondary;

          return (
            <div key={i}>
              <div className="flex justify-between text-sm mb-2 gap-3">
                <span
                  className="font-bold transition-colors duration-300"
                  style={{ color: "var(--foreground)" }}
                >
                  {item.label}
                </span>
                <span
                  className="font-bold transition-colors duration-300 shrink-0"
                  style={{ color: valueColor }}
                >
                  {item.valueLabel ?? item.value}
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
                    backgroundColor: barColor,
                  }}
                />
              </div>
              {item.description && (
                <p
                  className="text-xs mt-2 leading-relaxed"
                  style={{ color: "var(--muted)" }}
                >
                  {item.description}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <InsightCaption text={section.insight} />
    </div>
  );
}
