import type { TakeawaySection } from "../../types/infographic";
import type { InfographicTheme } from "../../lib/infographic-theme";
import { InsightCaption } from "./InsightCaption";

type TakeawayCardProps = {
  section: TakeawaySection;
  theme: InfographicTheme;
  isHovered: boolean;
};

export function TakeawayCard({
  section,
  theme,
  isHovered,
}: TakeawayCardProps) {
  const bulletColor = isHovered ? theme.primary : theme.accent;

  return (
    <div className="flex flex-col gap-4">
      <ul className="space-y-4">
        {section.points?.map((point, i) => (
          <li
            key={i}
            className="flex gap-4 items-start transition-all duration-300"
            style={{ transform: isHovered ? "translateX(4px)" : "none" }}
          >
            <span
              className="w-2.5 h-2.5 mt-2 rounded-full shrink-0 transition-transform duration-300"
              style={{ backgroundColor: bulletColor }}
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
      <InsightCaption text={section.insight} />
    </div>
  );
}
