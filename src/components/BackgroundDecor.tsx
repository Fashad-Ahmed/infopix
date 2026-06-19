export function BackgroundDecor() {
  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      {/* Glossy sphere — top right */}
      <div
        style={{
          position: "absolute",
          top: "-12vmax",
          right: "-10vmax",
          width: "48vmax",
          height: "48vmax",
          borderRadius: "50%",
          background: `
            radial-gradient(circle at 27% 21%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.45) 3%, transparent 9%),
            radial-gradient(circle at 50% 50%, var(--accent) 0%, var(--primary) 60%, var(--primary) 100%)
          `,
          opacity: 0.3,
          filter: "blur(0.5px)",
          boxShadow: `
            inset -4vmax -4vmax 7vmax rgba(0,0,0,0.6),
            inset 0.8vmax 0.8vmax 1.4vmax rgba(255,255,255,0.55)
          `,
        }}
      />

      {/* Glossy donut-chart ring — bottom left, segmented like a chart */}
      <div
        style={{
          position: "absolute",
          bottom: "-20vmax",
          left: "-16vmax",
          width: "46vmax",
          height: "46vmax",
          borderRadius: "50%",
          opacity: 0.3,
          background: `conic-gradient(var(--primary) 0deg 110deg, var(--accent) 110deg 200deg, var(--primary) 200deg 360deg)`,
          WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 5vmax), #fff calc(100% - 5vmax) calc(100% - 0.4vmax), transparent calc(100% - 0.2vmax))",
          mask: "radial-gradient(farthest-side, transparent calc(100% - 5vmax), #fff calc(100% - 5vmax) calc(100% - 0.4vmax), transparent calc(100% - 0.2vmax))",
          filter: "blur(1.5px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-20vmax",
          left: "-16vmax",
          width: "46vmax",
          height: "46vmax",
          borderRadius: "50%",
          background: `
            radial-gradient(circle at 38% 26%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.4) 3%, transparent 10%),
            radial-gradient(circle at 35% 30%, rgba(255,255,255,0.4), transparent 45%)
          `,
          opacity: 0.3,
        }}
      />

      {/* Small glossy accent bead — softens the empty middle-right space */}
      <div
        style={{
          position: "absolute",
          top: "38vh",
          right: "6vmax",
          width: "14vmax",
          height: "14vmax",
          borderRadius: "50%",
          background: `
            radial-gradient(circle at 30% 26%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.3) 6%, transparent 30%),
            radial-gradient(circle at 50% 50%, var(--primary) 0%, var(--accent) 100%)
          `,
          opacity: 0.24,
          filter: "blur(1px)",
          boxShadow: "inset -1vmax -1vmax 2.5vmax rgba(0,0,0,0.4)",
        }}
      />
    </div>
  );
}
