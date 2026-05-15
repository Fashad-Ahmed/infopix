import html2canvas from "html2canvas";

export async function exportElementToPng(
  element: HTMLElement,
  filename: string,
  options?: { scale?: number; backgroundColor?: string },
): Promise<void> {
  const scale = options?.scale ?? 2;
  const surfaceVar = getComputedStyle(document.documentElement)
    .getPropertyValue("--surface")
    .trim();
  const bg =
    options?.backgroundColor ||
    getComputedStyle(element).backgroundColor ||
    surfaceVar ||
    "#ffffff";

  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    allowTaint: false,
    backgroundColor: bg.startsWith("var(") ? undefined : bg,
    logging: false,
    onclone: (doc) => {
      const cloned = doc.querySelector(".infographic-export-root");
      if (cloned instanceof HTMLElement) {
        cloned.style.boxShadow = "none";
      }
    },
  });

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/png", 1),
  );
  if (!blob) throw new Error("Failed to encode PNG");

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".png") ? filename : `${filename}.png`;
  link.click();
  URL.revokeObjectURL(url);
}

export function slugifyFilename(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  return slug || "infographic";
}
