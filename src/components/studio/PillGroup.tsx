"use client";

export function PillGroup<T extends string>({
  options,
  value,
  onChange,
  small,
}: {
  options: readonly { value: T; label: string; hint?: string }[];
  value: T;
  onChange: (v: T) => void;
  small?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            title={o.hint}
            style={{
              borderRadius: "9999px",
              padding: small ? "0.35rem 0.85rem" : "0.45rem 1rem",
              fontSize: small ? "0.75rem" : "0.8rem",
              fontWeight: 600,
              border: `1.5px solid ${active ? "var(--primary)" : "var(--border)"}`,
              backgroundColor: active ? "var(--primary-soft)" : "transparent",
              color: active ? "var(--primary)" : "var(--muted)",
              cursor: "pointer",
              transition: "all 0.15s ease",
              whiteSpace: "nowrap",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
