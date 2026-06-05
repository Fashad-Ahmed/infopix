"use client";

import { useCallback, useRef, useState } from "react";
import type { Toast, ToastType } from "../types/infographic";

const AUTO_DISMISS_MS = 5000;

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const remove = useCallback((id: string) => {
    const existing = timeoutsRef.current.get(id);
    if (existing !== undefined) {
      clearTimeout(existing);
      timeoutsRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const add = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, message, type }]);
      const timer = setTimeout(() => {
        timeoutsRef.current.delete(id);
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, AUTO_DISMISS_MS);
      timeoutsRef.current.set(id, timer);
    },
    [],
  );

  return { toasts, add, remove };
}
