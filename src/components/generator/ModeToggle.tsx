import { Lightbulb, Link as LinkIcon } from "lucide-react";
import type { GenerationMode } from "../../types/infographic";

const MODES: {
  value: GenerationMode;
  label: string;
  Icon: typeof LinkIcon;
}[] = [
  { value: "url", label: "URL", Icon: LinkIcon },
  { value: "topic", label: "Topic", Icon: Lightbulb },
];

type ModeToggleProps = {
  mode: GenerationMode;
  onChange: (mode: GenerationMode) => void;
};

export function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div
      className="inline-flex p-1 rounded-full border mb-6"
      style={{
        backgroundColor: "var(--surface-alt)",
        borderColor: "var(--border)",
      }}
    >
      {MODES.map(({ value, label, Icon }) => {
        const active = mode === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => onChange(value)}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-full transition-all duration-200"
            style={{
              backgroundColor: active ? "var(--primary)" : "transparent",
              color: active ? "var(--on-primary)" : "var(--muted)",
            }}
          >
            <Icon className="w-4 h-4" aria-hidden />
            {label}
          </button>
        );
      })}
    </div>
  );
}
