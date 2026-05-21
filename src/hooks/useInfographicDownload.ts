"use client";

import { useCallback, useState } from "react";
import { downloadInfographic, type DownloadKind } from "../lib/download";
import type { Theme } from "./useTheme";

type Params = {
  node: HTMLElement | null;
  title?: string;
  theme: Theme;
};

export function useInfographicDownload({ node, title, theme }: Params) {
  const [pending, setPending] = useState<DownloadKind | null>(null);

  const download = useCallback(
    async (kind: DownloadKind) => {
      if (!node || !title) return { ok: false as const, error: "Nothing to capture" };
      setPending(kind);
      try {
        await downloadInfographic({
          node,
          title,
          backgroundColor: theme === "dark" ? "#0c1222" : "#ffffff",
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
    [node, title, theme],
  );

  return { pending, download };
}
