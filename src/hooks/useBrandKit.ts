"use client";

import { useCallback, useEffect, useState } from "react";
import {
  applyBrandStyle,
  createBrandKit,
  hasVisualOverrides,
  isValidLogoDataUrl,
  parseBrandKits,
  sanitizeBrandKit,
  serializeBrandKits,
  type BrandKit,
  type LogoPlacement,
} from "../lib/brand-kit";
import type { BrandStyle } from "../types/infographic";

const STORAGE_KEY = "infopix.studio.brandKits";
const ACCEPTED_LOGO_TYPES = ["image/png", "image/jpeg", "image/svg+xml", "image/webp"];

export type LogoUploadError = "unsupported-type" | "too-large" | "unreadable";

function readStoredKits(): BrandKit[] {
  if (typeof window === "undefined") return [];
  try {
    return parseBrandKits(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return [];
  }
}

function writeStoredKits(kits: BrandKit[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, serializeBrandKits(kits));
  } catch {
    // Storage unavailable (private mode, quota) — profile saving silently no-ops.
  }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("unreadable"));
    };
    reader.onerror = () => reject(new Error("unreadable"));
    reader.readAsDataURL(file);
  });
}

export function useBrandKit() {
  const [draft, setDraft] = useState<BrandKit>(() => createBrandKit("My brand"));
  const [profiles, setProfiles] = useState<BrandKit[]>([]);
  const [logoError, setLogoError] = useState<LogoUploadError | null>(null);

  useEffect(() => {
    setProfiles(readStoredKits());
  }, []);

  const patchDraft = useCallback((patch: Partial<BrandKit>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  }, []);

  const setLogo = useCallback(async (file: File) => {
    setLogoError(null);
    if (!ACCEPTED_LOGO_TYPES.includes(file.type)) {
      setLogoError("unsupported-type");
      return;
    }
    let dataUrl: string;
    try {
      dataUrl = await readFileAsDataUrl(file);
    } catch {
      setLogoError("unreadable");
      return;
    }
    if (!isValidLogoDataUrl(dataUrl)) {
      setLogoError("too-large");
      return;
    }
    patchDraft({ logoDataUrl: dataUrl });
  }, [patchDraft]);

  const clearLogo = useCallback(() => {
    setLogoError(null);
    patchDraft({ logoDataUrl: null });
  }, [patchDraft]);

  const setLogoPlacement = useCallback((placement: LogoPlacement) => {
    patchDraft({ logoPlacement: placement });
  }, [patchDraft]);

  const setColor = useCallback((key: "primaryColor" | "accentColor" | "secondaryColor", value: string | null) => {
    patchDraft({ [key]: value } as Partial<BrandKit>);
  }, [patchDraft]);

  const setFooterText = useCallback((value: string | null) => {
    patchDraft({ footerText: value && value.trim() ? value : null });
  }, [patchDraft]);

  const setName = useCallback((name: string) => {
    patchDraft({ name });
  }, [patchDraft]);

  const resetDraft = useCallback(() => {
    setLogoError(null);
    setDraft((prev) => createBrandKit(prev.name));
  }, []);

  const saveProfile = useCallback(() => {
    const toSave = sanitizeBrandKit(draft) ?? { ...draft, name: draft.name.trim() || "Untitled brand" };
    setProfiles((prev) => {
      const existingIndex = prev.findIndex((p) => p.id === toSave.id);
      const next = existingIndex >= 0
        ? prev.map((p, i) => (i === existingIndex ? toSave : p))
        : [...prev, toSave];
      writeStoredKits(next);
      return next;
    });
  }, [draft]);

  const loadProfile = useCallback((id: string) => {
    setProfiles((prev) => {
      const found = prev.find((p) => p.id === id);
      if (found) {
        setLogoError(null);
        setDraft(found);
      }
      return prev;
    });
  }, []);

  const deleteProfile = useCallback((id: string) => {
    setProfiles((prev) => {
      const next = prev.filter((p) => p.id !== id);
      writeStoredKits(next);
      return next;
    });
  }, []);

  const styleFor = useCallback((style: BrandStyle | undefined): BrandStyle | undefined => {
    return applyBrandStyle(style, draft);
  }, [draft]);

  return {
    draft,
    profiles,
    logoError,
    isActive: hasVisualOverrides(draft),
    setName,
    setLogo,
    clearLogo,
    setLogoPlacement,
    setColor,
    setFooterText,
    resetDraft,
    saveProfile,
    loadProfile,
    deleteProfile,
    styleFor,
  };
}

export type BrandKitController = ReturnType<typeof useBrandKit>;
