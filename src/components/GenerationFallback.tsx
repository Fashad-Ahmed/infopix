type GenerationFallbackProps = {
  variant: "insufficient_data" | "workflow_failed" | "invalid_response" | "network";
  message?: string;
  onRetry?: () => void;
};

const COPY: Record<
  GenerationFallbackProps["variant"],
  { title: string; body: string; icon: string }
> = {
  insufficient_data: {
    icon: "📊",
    title: "Not enough hard data",
    body: "We couldn't extract enough metrics or comparisons from that link. Try a README, benchmark post, or doc with clear numbers and stats.",
  },
  workflow_failed: {
    icon: "⚙️",
    title: "Generation hit a snag",
    body: "Our AI pipeline couldn't finish processing this source. Wait a moment and try again, or paste a different URL.",
  },
  invalid_response: {
    icon: "🧩",
    title: "Unexpected result shape",
    body: "The server returned data we couldn't render. Try generating again or use another document URL.",
  },
  network: {
    icon: "🌐",
    title: "Connection problem",
    body: "We couldn't reach the server. Check your connection and try again.",
  },
};

export default function GenerationFallback({
  variant,
  message,
  onRetry,
}: GenerationFallbackProps) {
  const copy = COPY[variant];

  return (
    <div
      className="max-w-2xl mx-auto rounded-[1.75rem] p-10 text-center animate-slide-down border"
      style={{
        backgroundColor: "var(--surface)",
        borderColor: "var(--border)",
        boxShadow: "var(--card-shadow)",
      }}
      role="alert"
    >
      <div className="text-5xl mb-4" aria-hidden>
        {copy.icon}
      </div>
      <h2
        className="text-2xl font-bold mb-3"
        style={{ color: "var(--foreground)" }}
      >
        {copy.title}
      </h2>
      <p
        className="text-base leading-relaxed mb-2"
        style={{ color: "var(--muted)" }}
      >
        {message ?? copy.body}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 rounded-xl px-6 py-3 text-sm font-semibold transition-all hover:opacity-90"
          style={{
            backgroundColor: "var(--primary)",
            color: "var(--on-primary)",
          }}
        >
          Try another URL
        </button>
      )}
    </div>
  );
}
