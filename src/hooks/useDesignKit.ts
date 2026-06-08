"use client";

import { useCallback, useMemo, useState } from "react";
import {
  createDesignKit,
  hasDesignOverrides,
  type AccentStyleOption,
  type DesignKit,
  type FontOption,
} from "../lib/design-kit";

export function useDesignKit() {
  const [draft, setDraft] = useState<DesignKit>(() => createDesignKit());

  const setFont = useCallback((value: FontOption) => {
    setDraft((prev) => ({ ...prev, primaryFont: value }));
  }, []);

  const setAccentStyle = useCallback((value: AccentStyleOption) => {
    setDraft((prev) => ({ ...prev, accentStyle: value }));
  }, []);

  const resetFont = useCallback(() => {
    setDraft((prev) => ({ ...prev, primaryFont: null }));
  }, []);

  const resetAccentStyle = useCallback(() => {
    setDraft((prev) => ({ ...prev, accentStyle: null }));
  }, []);

  const reset = useCallback(() => {
    setDraft(createDesignKit());
  }, []);

  const isActive = useMemo(() => hasDesignOverrides(draft), [draft]);

  return { draft, isActive, setFont, setAccentStyle, resetFont, resetAccentStyle, reset };
}

export type UseDesignKitReturn = ReturnType<typeof useDesignKit>;
