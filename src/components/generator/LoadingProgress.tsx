import type { GenerationMode } from "../../types/infographic";

type Step = {
  step: number;
  label: string;
  desc: string;
  range: [number, number];
};

function buildSteps(mode: GenerationMode): Step[] {
  return [
    {
      step: 1,
      label: mode === "url" ? "Content Extraction" : "Topic Research",
      desc:
        mode === "url"
          ? "Scraping and parsing URL content"
          : "Drafting structured content from topic",
      range: [0, 35],
    },
    {
      step: 2,
      label: "Structure Formatting",
      desc: "Organizing into JSON schema",
      range: [35, 60],
    },
    {
      step: 3,
      label: "Quality Verification",
      desc: "Critic Agent validating accuracy",
      range: [60, 80],
    },
    {
      step: 4,
      label: "Image Generation",
      desc: "Creating supporting AI imagery",
      range: [80, 100],
    },
  ];
}

type LoadingProgressProps = {
  progress: number;
  mode: GenerationMode;
};

export function LoadingProgress({ progress, mode }: LoadingProgressProps) {
  const steps = buildSteps(mode);

  return (
    <div
      className="max-w-2xl mx-auto rounded-[1.75rem] p-8 animate-slide-down"
      style={{
        backgroundColor: "var(--surface)",
        border: "1px solid var(--border)",
        boxShadow: "var(--card-shadow)",
      }}
    >
      <div className="mb-8">
        <div
          className="h-2 rounded-full overflow-hidden border"
          style={{
            backgroundColor: "var(--surface-alt)",
            borderColor: "var(--border)",
          }}
        >
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${progress}%`,
              backgroundColor: "var(--primary)",
              boxShadow: "0 0 14px var(--progress-glow)",
            }}
          />
        </div>
      </div>

      <div className="space-y-4">
        {steps.map((item) => {
          const active = progress >= item.range[0] && progress < item.range[1];
          return (
            <div
              key={item.step}
              className="flex items-start gap-4 p-4 rounded-xl transition-all duration-300"
              style={{
                backgroundColor: active
                  ? "var(--primary-soft)"
                  : "var(--surface-alt)",
                border: active
                  ? "1px solid var(--border-strong)"
                  : "1px solid transparent",
              }}
            >
              <div
                className="flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0 transition-all duration-300"
                style={{
                  backgroundColor: active ? "var(--primary)" : "var(--surface)",
                  color: active ? "var(--on-primary)" : "var(--muted)",
                  border: active ? "none" : "1px solid var(--border)",
                  animation: active
                    ? "step-pulse 1.5s ease-in-out infinite"
                    : "none",
                }}
              >
                {item.step}
              </div>
              <div className="flex-1">
                <h4
                  className="font-semibold transition-colors duration-300"
                  style={{ color: active ? "var(--primary)" : "var(--muted)" }}
                >
                  {item.label}
                </h4>
                <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
                  {item.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
