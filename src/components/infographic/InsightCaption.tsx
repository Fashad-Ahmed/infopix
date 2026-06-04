type InsightCaptionProps = {
  text?: string;
};

export function InsightCaption({ text }: InsightCaptionProps) {
  if (!text) return null;
  return (
    <p
      className="text-xs leading-relaxed italic mt-2 pt-3 border-t"
      style={{ color: "var(--muted)", borderColor: "var(--border)" }}
    >
      {text}
    </p>
  );
}
