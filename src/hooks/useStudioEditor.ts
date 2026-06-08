"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  canSwapSlots,
  compatibleSwapTargets,
  remapSlotAssignment,
  resolveSlot,
  swapSlots,
  updateChartType,
  updateSectionField,
} from "../lib/studio-editor";
import type { InfographicSection, SlotAssignment } from "../types/infographic";
import type { StudioViewModel } from "./useStudioGenerator";

type EditableState = {
  sections: InfographicSection[];
  slotAssignment: SlotAssignment;
};

/**
 * Owns the editable copy of a generated infographic's content + slot layout.
 * Source data stays untouched in `useStudioGenerator` — this hook layers a
 * draft on top so "Reset" can always restore the original generation.
 */
export function useStudioEditor(source: StudioViewModel | null) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<EditableState | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  // New generation arrives → drop any in-progress draft and exit edit mode.
  useEffect(() => {
    setDraft(null);
    setSelectedSlot(null);
    setEditing(false);
  }, [source]);

  const templateId = source?.slotAssignment.template ?? null;
  const sections = draft?.sections ?? source?.sections ?? [];
  const slotAssignment = draft?.slotAssignment ?? source?.slotAssignment ?? null;
  const isDirty = draft !== null;

  const ensureDraft = useCallback((): EditableState | null => {
    if (draft) return draft;
    if (!source) return null;
    const seeded: EditableState = { sections: source.sections, slotAssignment: source.slotAssignment };
    setDraft(seeded);
    return seeded;
  }, [draft, source]);

  const setField = useCallback(
    (sectionIndex: number, field: string, value: string) => {
      const base = ensureDraft();
      if (!base) return;
      const nextSections = updateSectionField(base.sections, sectionIndex, field, value);
      if (nextSections === base.sections) return; // no-op edit (invalid field/index)
      setDraft({ ...base, sections: nextSections });
    },
    [ensureDraft],
  );

  const setChartType = useCallback(
    (sectionIndex: number, chartType: string) => {
      const base = ensureDraft();
      if (!base) return;
      const nextSections = updateChartType(base.sections, sectionIndex, chartType);
      if (nextSections === base.sections) return;
      setDraft({ ...base, sections: nextSections });
    },
    [ensureDraft],
  );

  const setTemplate = useCallback(
    (templateId: string) => {
      const base = ensureDraft();
      if (!base) return;
      const remapped = remapSlotAssignment(templateId, base.sections, base.slotAssignment);
      if (!remapped || remapped === base.slotAssignment) return;
      setDraft({ ...base, slotAssignment: remapped });
      setSelectedSlot(null);
    },
    [ensureDraft],
  );

  const trySwap = useCallback(
    (slotA: string, slotB: string): boolean => {
      const base = ensureDraft();
      if (!base || !templateId) return false;
      if (!canSwapSlots(templateId, base.slotAssignment, base.sections, slotA, slotB)) return false;
      setDraft({ ...base, slotAssignment: swapSlots(base.slotAssignment, slotA, slotB) });
      return true;
    },
    [ensureDraft, templateId],
  );

  /** Click-to-swap: first click selects a slot, second click attempts the swap. */
  const handleSlotClick = useCallback(
    (slotName: string) => {
      if (!selectedSlot) {
        setSelectedSlot(slotName);
        return;
      }
      if (selectedSlot === slotName) {
        setSelectedSlot(null);
        return;
      }
      trySwap(selectedSlot, slotName);
      setSelectedSlot(null);
    },
    [selectedSlot, trySwap],
  );

  const reset = useCallback(() => {
    setDraft(null);
    setSelectedSlot(null);
  }, []);

  const toggleEditing = useCallback(() => {
    setEditing((prev) => {
      if (prev) setSelectedSlot(null);
      return !prev;
    });
  }, []);

  const swapTargetsFor = useCallback(
    (slotName: string): string[] => {
      if (!templateId || !slotAssignment) return [];
      return compatibleSwapTargets(templateId, slotAssignment, sections, slotName);
    },
    [templateId, slotAssignment, sections],
  );

  const slotInfo = useCallback(
    (slotName: string) => {
      if (!templateId || !slotAssignment) return null;
      return resolveSlot(templateId, slotAssignment, sections, slotName);
    },
    [templateId, slotAssignment, sections],
  );

  /** View model with edits applied — what the canvas should render. */
  const viewModel: StudioViewModel | null = useMemo(() => {
    if (!source) return null;
    if (!draft) return source;
    return { ...source, sections: draft.sections, slotAssignment: draft.slotAssignment };
  }, [source, draft]);

  return {
    editing,
    toggleEditing,
    viewModel,
    isDirty,
    reset,
    selectedSlot,
    handleSlotClick,
    setField,
    setChartType,
    setTemplate,
    trySwap,
    swapTargetsFor,
    slotInfo,
  };
}
