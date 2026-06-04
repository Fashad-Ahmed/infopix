import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartSection } from "../../types/infographic";
import type { InfographicTheme } from "../../lib/infographic-theme";
import { InsightCaption } from "./InsightCaption";

const FALLBACK_PALETTE = ["#fdbc2b", "#fb3364", "#42a4cd", "#70b52b"];

function buildPalette(theme: InfographicTheme): string[] {
  return [theme.primary, theme.accent, theme.secondary, ...FALLBACK_PALETTE];
}

type ChartCardProps = {
  section: ChartSection;
  theme: InfographicTheme;
};

export function ChartCard({ section, theme }: ChartCardProps) {
  const palette = buildPalette(theme);
  const data = (section.data ?? []).map((d, i) => ({
    name: d.label,
    value: Number(d.value) || 0,
    valueLabel: d.valueLabel,
    fill: palette[i % palette.length],
  }));

  const unit = section.unit ?? "";
  const formatValue = (v: unknown, n: unknown): [string, string] => {
    const num = Number(v) || 0;
    const item = data.find((d) => d.name === n);
    return [item?.valueLabel ?? `${num}${unit ? ` ${unit}` : ""}`, ""];
  };

  const tooltipStyle = {
    backgroundColor: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    color: "var(--foreground)",
  } as const;

  return (
    <div className="flex flex-col gap-4">
      <div style={{ width: "100%", height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          {section.chartType === "bar" ? (
            <BarChart
              data={data}
              margin={{ top: 8, right: 8, left: 0, bottom: 8 }}
            >
              <XAxis
                dataKey="name"
                tick={{ fill: "var(--muted)", fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: "var(--border)" }}
              />
              <YAxis
                tick={{ fill: "var(--muted)", fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: "var(--border)" }}
              />
              <Tooltip
                cursor={{ fill: "var(--card-hover-tint)" }}
                contentStyle={tooltipStyle}
                formatter={(v, _n, p) =>
                  formatValue(v, (p as { payload?: { name?: string } })?.payload?.name)
                }
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={section.chartType === "donut" ? 50 : 0}
                outerRadius={90}
                paddingAngle={section.chartType === "donut" ? 2 : 0}
                stroke="var(--surface-alt)"
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v, n) => formatValue(v, n)}
              />
              <Legend
                wrapperStyle={{ fontSize: 12, color: "var(--muted)" }}
              />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
      <InsightCaption text={section.insight} />
    </div>
  );
}
