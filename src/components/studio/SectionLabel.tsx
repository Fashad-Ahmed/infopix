"use client";

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="flex items-center gap-2 mb-3"
      style={{
        fontSize: "0.65rem",
        fontWeight: 700,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: "var(--muted)",
      }}
    >
      {children}
    </p>
  );
}
