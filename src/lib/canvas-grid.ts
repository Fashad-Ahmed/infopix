// Pure CSS-grid-areas algorithms used by StudioCanvas to collapse or
// redistribute space around empty template slots. No React/DOM dependency —
// kept separate so the layout logic can be unit tested on its own.

// Parses a `gridTemplateAreas` string ("a a" "b c") into a 2D array of area names.
export function parseGridAreas(template: string): string[][] {
  const rows = template.match(/"[^"]*"/g) ?? [];
  return rows.map((r) => r.slice(1, -1).trim().split(/\s+/).filter(Boolean));
}

// Zeroes out the track size for any row/column whose cells are entirely
// empty slots, letting neighboring `1fr` tracks absorb the freed space.
// Falls back to the original tracks if the shape is unexpected or every
// track would collapse (degenerate / fully-empty layout).
export function collapseEmptyTracks(
  tracks: string,
  areaGrid: string[][],
  axis: "row" | "col",
  emptyAreas: Set<string>,
): string {
  const sizes = tracks.trim().split(/\s+/);
  const count = axis === "row" ? areaGrid.length : (areaGrid[0]?.length ?? 0);
  if (sizes.length !== count || count === 0) return tracks;

  const collapsible = Array.from({ length: count }, (_, i) => {
    const cells = axis === "row" ? areaGrid[i] : areaGrid.map((row) => row[i]);
    return cells.length > 0 && cells.every((area) => emptyAreas.has(area));
  });

  if (collapsible.every(Boolean) || !collapsible.some(Boolean)) return tracks;

  return sizes.map((size, i) => (collapsible[i] ? "0px" : size)).join(" ");
}

export type AreaBounds = { r0: number; r1: number; c0: number; c1: number };

// Computes the row/column span (0-indexed, inclusive) each named grid area occupies.
export function computeAreaBounds(areaGrid: string[][]): Record<string, AreaBounds> {
  const bounds: Record<string, AreaBounds> = {};
  areaGrid.forEach((row, r) => {
    row.forEach((area, c) => {
      if (area === ".") return;
      const b = bounds[area];
      if (!b) bounds[area] = { r0: r, r1: r, c0: c, c1: c };
      else {
        b.r0 = Math.min(b.r0, r); b.r1 = Math.max(b.r1, r);
        b.c0 = Math.min(b.c0, c); b.c1 = Math.max(b.c1, c);
      }
    });
  });
  return bounds;
}

// Handles "interior hole" empty slots that collapseEmptyTracks can't fix —
// e.g. an empty cell sharing its row/column with an occupied neighbor, so the
// track itself can't shrink to 0. Instead, extend the one adjacent occupied
// area that exactly lines up on the cross-axis to grow into the empty cell,
// and mark the empty area as absorbed so it renders nothing. Conservative by
// design: only grows when exactly one neighbor cleanly spans the gap.
export function growEmptyAreasIntoNeighbors(
  areaGrid: string[][],
  bounds: Record<string, AreaBounds>,
  emptyAreas: Set<string>,
  structuralAreas: Set<string>,
): { overrides: Map<string, AreaBounds>; absorbed: Set<string> } {
  const overrides = new Map<string, AreaBounds>();
  const absorbed = new Set<string>();
  const numRows = areaGrid.length;
  const numCols = areaGrid[0]?.length ?? 0;

  const isEligible = (cand: string) =>
    !emptyAreas.has(cand) && !structuralAreas.has(cand) && !absorbed.has(cand);

  for (const area of emptyAreas) {
    const b = bounds[area];
    if (!b) continue;

    const tryVertical = (neighborRow: number, growUp: boolean): boolean => {
      if (neighborRow < 0 || neighborRow >= numRows) return false;
      const names = new Set<string>();
      for (let c = b.c0; c <= b.c1; c++) names.add(areaGrid[neighborRow][c]);
      if (names.size !== 1) return false;
      const [cand] = names;
      if (!isEligible(cand)) return false;
      const cb = bounds[cand];
      if (!cb || cb.c0 !== b.c0 || cb.c1 !== b.c1) return false;
      const merged = overrides.get(cand) ?? { ...cb };
      if (growUp) merged.r0 = Math.min(merged.r0, b.r0);
      else merged.r1 = Math.max(merged.r1, b.r1);
      overrides.set(cand, merged);
      absorbed.add(area);
      return true;
    };

    const tryHorizontal = (neighborCol: number, growLeft: boolean): boolean => {
      if (neighborCol < 0 || neighborCol >= numCols) return false;
      const names = new Set<string>();
      for (let r = b.r0; r <= b.r1; r++) names.add(areaGrid[r][neighborCol]);
      if (names.size !== 1) return false;
      const [cand] = names;
      if (!isEligible(cand)) return false;
      const cb = bounds[cand];
      if (!cb || cb.r0 !== b.r0 || cb.r1 !== b.r1) return false;
      const merged = overrides.get(cand) ?? { ...cb };
      if (growLeft) merged.c0 = Math.min(merged.c0, b.c0);
      else merged.c1 = Math.max(merged.c1, b.c1);
      overrides.set(cand, merged);
      absorbed.add(area);
      return true;
    };

    if (tryVertical(b.r1 + 1, true)) continue;
    if (tryVertical(b.r0 - 1, false)) continue;
    if (tryHorizontal(b.c1 + 1, true)) continue;
    tryHorizontal(b.c0 - 1, false);
  }

  return { overrides, absorbed };
}
