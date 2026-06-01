"use client";

import { useCallback, useState } from "react";
import { downloadInfographic, type DownloadKind } from "../lib/download";
import type { Theme } from "./useTheme";

type Params = {
  node: HTMLElement | null;
  title?: string;
  theme: Theme;
  /** Explicit capture background — use the infographic's own canvas color so the
   *  exported file matches the on-screen preview (not the page theme). */
  backgroundColor?: string;
};

export function useInfographicDownload({ node, title, theme, backgroundColor }: Params) {
  const [pending, setPending] = useState<DownloadKind | null>(null);

  const download = useCallback(
    async (kind: DownloadKind) => {
      if (!node || !title) return { ok: false as const, error: "Nothing to capture" };
      setPending(kind);
      try {
        await downloadInfographic({
          node,
          title,
          backgroundColor: backgroundColor ?? (theme === "dark" ? "#0c1222" : "#ffffff"),
          kind,
        });
        return { ok: true as const };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Download failed";
        return { ok: false as const, error: message };
      } finally {
        setPending(null);
      }
    },
    [node, title, theme, backgroundColor],
  );

  return { pending, download };
}
