"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";
import { setLocale } from "../actions/locale";
import { useRouter } from "next/navigation";

const LOCALES = [
  { code: "en", label: "EN" },
  { code: "it", label: "IT" },
] as const;

type Props = {
  style?: React.CSSProperties;
};

export function LocaleSwitcher({ style }: Props) {
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSwitch = (code: string) => {
    if (code === locale) return;
    startTransition(async () => {
      await setLocale(code as "en" | "it");
      router.refresh();
    });
  };

  return (
    <div
      className="inline-flex items-center rounded-full border overflow-hidden"
      style={{ borderColor: "var(--border)", opacity: isPending ? 0.6 : 1, ...style }}
    >
      {LOCALES.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          onClick={() => handleSwitch(code)}
          disabled={isPending}
          className="px-3 py-1.5 text-xs font-bold transition-colors duration-150"
          style={{
            backgroundColor: locale === code ? "var(--primary)" : "var(--surface)",
            color: locale === code ? "var(--on-primary)" : "var(--muted)",
            cursor: locale === code ? "default" : "pointer",
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
