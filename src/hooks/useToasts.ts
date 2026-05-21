"use client";

import { useCallback, useRef, useState } from "react";
import type { Toast, ToastType } from "../types/infographic";

const AUTO_DISMISS_MS = 4000;

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const add = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, message, type }]);

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, AUTO_DISMISS_MS);
    },
    [],
  );

  return { toasts, add, remove };
}
