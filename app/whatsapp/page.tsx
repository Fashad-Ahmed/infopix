"use client";

import { notFound } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bot,
  MessageCircle,
  Send,
  Smartphone,
  Zap,
} from "lucide-react";

type EnvStatus = {
  SPOKI_API_KEY: boolean;
  SPOKI_WEBHOOK_SECRET: boolean;
  SPOKI_BOT_PHONE: string | null;
};

type TestResult = {
  whatsappMessage: string;
  error?: string;
};

const WEBHOOK_PATH = "/api/spoki-webhook";

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span
      className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
      style={{ backgroundColor: ok ? "var(--success)" : "var(--error)" }}
    />
  );
}

function EnvRow({
  label,
  ok,
  hint,
}: {
  label: string;
  ok: boolean;
  hint: string;
}) {
  return (
    <div
      className="flex items-start gap-3 p-4 rounded-xl"
      style={{ backgroundColor: "var(--surface-alt)", border: "1px solid var(--border)" }}
    >
      <StatusDot ok={ok} />
      <div className="flex-1 min-w-0">
        <p className="font-mono text-sm font-semibold" style={{ color: "var(--foreground)" }}>
          {label}
        </p>
        <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
          {ok ? "Configured" : hint}
        </p>
      </div>
      <span
        className="text-xs font-semibold px-2 py-0.5 rounded-full"
        style={{
          backgroundColor: ok ? "color-mix(in srgb, var(--success) 14%, transparent)" : "color-mix(in srgb, var(--error) 12%, transparent)",
          color: ok ? "var(--success)" : "var(--error)",
        }}
      >
        {ok ? "SET" : "MISSING"}
      </span>
    </div>
  );
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={copy}
      className="text-xs px-2.5 py-1 rounded-lg font-medium transition-all duration-150"
      style={{
        backgroundColor: copied ? "color-mix(in srgb, var(--success) 14%, transparent)" : "var(--hover)",
        color: copied ? "var(--success)" : "var(--primary)",
        border: "1px solid var(--border)",
      }}
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function CodeBlock({ children }: { children: string }) {
  return (
    <div
      className="relative rounded-xl p-4 font-mono text-sm overflow-x-auto"
      style={{ backgroundColor: "var(--surface-alt)", border: "1px solid var(--border)" }}
    >
      <pre className="whitespace-pre-wrap break-all" style={{ color: "var(--foreground)", margin: 0 }}>
        {children}
      </pre>
      <div className="absolute top-3 right-3">
        <CopyButton value={children} />
      </div>
    </div>
  );
}

function WhatsAppBubble({ message }: { message: string }) {
  const renderLine = (line: string, i: number) => {
    // Bold: *text*
    const parts = line.split(/(\*[^*]+\*)/g);
    return (
      <p key={i} className={`${i > 0 ? "mt-1" : ""} leading-relaxed`}>
        {parts.map((part, j) =>
          part.startsWith("*") && part.endsWith("*") ? (
            <strong key={j}>{part.slice(1, -1)}</strong>
          ) : (
            <span key={j}>{part}</span>
          ),
        )}
      </p>
    );
  };

  return (
    <div className="flex justify-end">
      <div
        className="max-w-xs rounded-2xl rounded-br-sm px-4 py-3 text-sm shadow-sm"
        style={{ backgroundColor: "#dcf8c6", color: "#111827" }}
      >
        {message.split("\n").map((line, i) =>
          line === "" ? <div key={i} className="h-2" /> : renderLine(line, i),
        )}
        <p className="text-right text-xs mt-2 opacity-60">now · InfoPix Bot</p>
      </div>
    </div>
  );
}

export default function WhatsAppPage() {
  notFound();
  const [envStatus, setEnvStatus] = useState<EnvStatus | null>(null);
  const [origin, setOrigin] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const [testInput, setTestInput] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial =
      storedTheme === "light" || storedTheme === "dark"
        ? storedTheme
        : prefersDark
          ? "dark"
          : "light";
    setTheme(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
    setOrigin(window.location.origin);

    // Fetch env status from a lightweight check endpoint
    fetch("/api/spoki-status")
      .then((r) => r.json())
      .then(setEnvStatus)
      .catch(() => {});
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    window.localStorage.setItem("theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  const runTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testInput.trim()) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/spoki-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: testInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTestResult({ whatsappMessage: "", error: data.error ?? "Unknown error" });
      } else {
        setTestResult({ whatsappMessage: data.whatsappMessage });
      }
    } catch (err) {
      setTestResult({ whatsappMessage: "", error: String(err) });
    } finally {
      setTesting(false);
    }
  };

  const webhookUrl = origin ? `${origin}${WEBHOOK_PATH}` : WEBHOOK_PATH;
  const allConfigured = envStatus?.SPOKI_API_KEY && envStatus?.SPOKI_WEBHOOK_SECRET;

  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      {/* Nav */}
      <div className="max-w-3xl mx-auto mb-10 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-semibold transition-colors duration-200"
          style={{ color: "var(--muted)" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Back to InfoPix
        </Link>
        <button
          onClick={toggleTheme}
          className="rounded-full border px-3 py-1.5 text-sm font-semibold transition-all duration-200"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)", color: "var(--foreground)" }}
        >
          {theme === "dark" ? "Dark" : "Light"}
        </button>
      </div>

      <div className="max-w-3xl mx-auto space-y-8">

        {/* Header */}
        <div
          className="rounded-[2rem] p-8"
          style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--card-shadow)" }}
        >
          <div className="flex items-start gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: "#25d36614", border: "1px solid #25d36630" }}
            >
              <MessageCircle className="w-6 h-6" style={{ color: "#25d366" }} aria-hidden />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight" style={{ color: "var(--foreground)" }}>
                WhatsApp Integration
              </h1>
              <p className="mt-1 text-base" style={{ color: "var(--muted)" }}>
                Spoki webhook · InfoPix Bot
              </p>
            </div>
            <div className="ml-auto shrink-0">
              <span
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full"
                style={{
                  backgroundColor: allConfigured
                    ? "color-mix(in srgb, var(--success) 14%, transparent)"
                    : "color-mix(in srgb, var(--warning) 14%, transparent)",
                  color: allConfigured ? "var(--success)" : "var(--warning)",
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: allConfigured ? "var(--success)" : "var(--warning)" }}
                />
                {allConfigured ? "Ready" : "Needs setup"}
              </span>
            </div>
          </div>
        </div>

        {/* Env Status */}
        <section
          className="rounded-[2rem] p-8"
          style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--card-shadow)" }}
        >
          <h2 className="text-lg font-black uppercase tracking-widest mb-6" style={{ color: "var(--foreground)" }}>
            Environment Variables
          </h2>
          <div className="space-y-3">
            <EnvRow
              label="SPOKI_API_KEY"
              ok={envStatus?.SPOKI_API_KEY ?? false}
              hint="Required — Spoki outbound API key for sending WhatsApp replies"
            />
            <EnvRow
              label="SPOKI_WEBHOOK_SECRET"
              ok={envStatus?.SPOKI_WEBHOOK_SECRET ?? false}
              hint="Recommended — shared secret to verify inbound Spoki webhooks"
            />
          </div>
          {envStatus?.SPOKI_BOT_PHONE && (
            <div className="mt-4 p-4 rounded-xl flex items-center gap-3" style={{ backgroundColor: "var(--surface-alt)", border: "1px solid var(--border)" }}>
              <span className="text-xl">📱</span>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--muted)" }}>WhatsApp Bot Number</p>
                <p className="font-mono font-bold mt-0.5" style={{ color: "var(--foreground)" }}>{envStatus?.SPOKI_BOT_PHONE}</p>
              </div>
            </div>
          )}
          <p className="mt-4 text-xs" style={{ color: "var(--muted)" }}>
            Add these to your <code className="font-mono">.env.local</code> file. Restart the server after changes.
          </p>
        </section>

        {/* Webhook URL */}
        {/* <section
          className="rounded-[2rem] p-8"
          style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--card-shadow)" }}
        >
          <h2 className="text-lg font-black uppercase tracking-widest mb-6" style={{ color: "var(--foreground)" }}>
            Webhook Endpoint
          </h2>
          <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
            Paste this URL into your Spoki dashboard under <strong>Webhook → Incoming Messages</strong>.
          </p>
          <CodeBlock>{webhookUrl}</CodeBlock>

          <div className="mt-6 space-y-3">
            <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>Setup steps</p>
            {[
              "Log in to app.spoki.it and open your project.",
              "Go to Settings → Webhooks → Add Webhook.",
              `Paste the URL above and set Method to POST.`,
              "If SPOKI_WEBHOOK_SECRET is set, add the header X-Spoki-Token: <your-secret>.",
              "Enable the \"Incoming message\" event trigger.",
              "Click Save and send a test WhatsApp message to your bot number.",
            ].map((step, i) => (
              <div key={i} className="flex gap-3 items-start">
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 mt-0.5"
                  style={{ backgroundColor: "var(--primary-soft)", color: "var(--primary)" }}
                >
                  {i + 1}
                </span>
                <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{step}</p>
              </div>
            ))}
          </div>
        </section> */}

        {/* Payload Format */}
        <section
          className="rounded-[2rem] p-8"
          style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--card-shadow)" }}
        >
          <h2 className="text-lg font-black uppercase tracking-widest mb-2" style={{ color: "var(--foreground)" }}>
            Expected Payload Shape
          </h2>
          <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
            The webhook accepts either field name variant Spoki sends.
          </p>
          <CodeBlock>{JSON.stringify(
            { phone: "+393319989152", message: "https://github.com/..." },
            null, 2
          )}</CodeBlock>
          <p className="mt-3 text-xs" style={{ color: "var(--muted)" }}>
            Also accepts <code className="font-mono">contact_id</code> instead of <code className="font-mono">phone</code>, and <code className="font-mono">text</code> instead of <code className="font-mono">message</code>.
          </p>
        </section>

        {/* Test Panel */}
        <section
          className="rounded-[2rem] p-8"
          style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--card-shadow)" }}
        >
          <h2 className="text-lg font-black uppercase tracking-widest mb-2" style={{ color: "var(--foreground)" }}>
            Test Panel
          </h2>
          <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
            Preview what your WhatsApp users will receive. Runs the full Mastra workflow — no message actually sent.
          </p>

          <form onSubmit={runTest} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--muted)" }}>
                URL or Text
              </label>
              <textarea
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                placeholder="https://github.com/mastraai/mastra or paste raw text..."
                rows={3}
                disabled={testing}
                className="w-full rounded-2xl px-5 py-4 text-sm resize-none outline-none transition-all duration-200"
                style={{
                  backgroundColor: "var(--surface-alt)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)",
                }}
              />
            </div>
            <button
              type="submit"
              disabled={testing || !testInput.trim()}
              className="rounded-2xl px-6 py-3 text-sm font-semibold transition-all duration-200"
              style={{
                backgroundColor: testing ? "var(--btn-loading-bg)" : "var(--primary)",
                color: "var(--on-primary)",
                opacity: !testInput.trim() && !testing ? 0.6 : 1,
                cursor: testing || !testInput.trim() ? "not-allowed" : "pointer",
                boxShadow: "var(--btn-shadow)",
              }}
            >
              {testing ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Running workflow (~15s)...
                </span>
              ) : (
                "▶ Preview WhatsApp Message"
              )}
            </button>
          </form>

          {testResult && (
            <div className="mt-8 space-y-4" style={{ animation: "slideInUp 0.4s ease-out" }}>
              {testResult?.error ? (
                <div
                  className="rounded-xl p-4 text-sm"
                  style={{
                    backgroundColor: "color-mix(in srgb, var(--error) 10%, transparent)",
                    border: "1px solid color-mix(in srgb, var(--error) 30%, transparent)",
                    color: "var(--error)",
                  }}
                >
                  <strong>Error:</strong> {testResult?.error}
                </div>
              ) : (
                <>
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
                    WhatsApp Preview
                  </p>
                  {/* WhatsApp chat bubble mock */}
                  <div
                    className="rounded-2xl p-6"
                    style={{ backgroundColor: "#e5ddd5", backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}
                  >
                    <WhatsAppBubble message={testResult?.whatsappMessage ?? ""} />
                  </div>

                  <p className="text-xs font-bold uppercase tracking-widest mt-4" style={{ color: "var(--muted)" }}>
                    Raw Message String
                  </p>
                  <CodeBlock>{testResult?.whatsappMessage ?? ""}</CodeBlock>
                </>
              )}
            </div>
          )}
        </section>

        {/* How it works */}
        <section
          className="rounded-[2rem] p-8 mb-12"
          style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--card-shadow)" }}
        >
          <h2 className="text-lg font-black uppercase tracking-widest mb-6" style={{ color: "var(--foreground)" }}>
            How It Works
          </h2>
          <div className="space-y-4">
            {[
              { Icon: Smartphone, title: "User sends URL", desc: "A WhatsApp user sends a URL or text to your Spoki bot number." },
              { Icon: Zap, title: "Instant ACK", desc: "Spoki forwards the message to this webhook. We return 200 OK in < 1s to avoid Spoki timeout." },
              { Icon: Bot, title: "Mastra workflow runs", desc: "In the background, three Groq LLM agents scrape, structure, and QA-validate the content (~15s)." },
              { Icon: Send, title: "Reply sent", desc: "The formatted infographic summary is sent back to the user via the Spoki outbound API." },
            ].map((item, i) => (
              <div key={i} className="flex gap-4 items-start p-4 rounded-xl" style={{ backgroundColor: "var(--surface-alt)", border: "1px solid var(--border)" }}>
                <item.Icon className="w-6 h-6 shrink-0 mt-0.5" style={{ color: "var(--primary)" }} aria-hidden />
                <div>
                  <p className="font-bold text-sm" style={{ color: "var(--foreground)" }}>{item.title}</p>
                  <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}
