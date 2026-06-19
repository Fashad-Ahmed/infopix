import { slugify } from "./slug";

export type DownloadKind = "png" | "pdf" | "html";

type CaptureOptions = {
  node: HTMLElement;
  title: string;
  backgroundColor: string;
  kind: DownloadKind;
};

async function captureNode(
  node: HTMLElement,
  backgroundColor: string,
): Promise<string> {
  const { toPng } = await import("html-to-image");
  const width = Math.max(node.scrollWidth, node.offsetWidth);
  const height = Math.max(node.scrollHeight, node.offsetHeight);
  return toPng(node, {
    cacheBust: true,
    pixelRatio: 2,
    backgroundColor,
    width,
    height,
    canvasWidth: width,
    canvasHeight: height,
    skipFonts: true,
    style: {
      transform: "none",
      margin: "0",
      width: `${width}px`,
      height: `${height}px`,
    },
  });
}

function triggerDownload(dataUrl: string, fileName: string) {
  const link = document.createElement("a");
  link.download = fileName;
  link.href = dataUrl;
  link.click();
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

// Concatenates every same-origin stylesheet's rules (Tailwind output + the
// @font-face rules next/font injects) so the exported document renders
// correctly with no connection to the live app — only the inline styles the
// region components already set plus these rules are needed.
function collectStyleSheetText(): string {
  let css = "";
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      for (const rule of Array.from(sheet.cssRules)) css += rule.cssText + "\n";
    } catch {
      // Cross-origin stylesheet — can't read its rules, skip.
    }
  }
  return css;
}

function buildStandaloneHtml(node: HTMLElement, title: string, backgroundColor: string): string {
  const htmlClass = document.documentElement.className;
  const css = collectStyleSheetText();
  return `<!doctype html>
<html lang="en" class="${escapeHtml(htmlClass)}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)}</title>
<style>
html, body { margin: 0; padding: 0; background: ${backgroundColor}; }
${css}
</style>
</head>
<body>
${node.outerHTML}
</body>
</html>`;
}

function downloadHtml(node: HTMLElement, title: string, backgroundColor: string) {
  const html = buildStandaloneHtml(node, title, backgroundColor);
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, `${slugify(title)}.html`);
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

async function dataUrlToImage(dataUrl: string): Promise<HTMLImageElement> {
  const img = new Image();
  img.src = dataUrl;
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("image load failed"));
  });
  return img;
}

export async function downloadInfographic({
  node,
  title,
  backgroundColor,
  kind,
}: CaptureOptions): Promise<void> {
  if (kind === "html") {
    downloadHtml(node, title, backgroundColor);
    return;
  }

  const dataUrl = await captureNode(node, backgroundColor);
  const baseName = slugify(title);

  if (kind === "png") {
    triggerDownload(dataUrl, `${baseName}.png`);
    return;
  }

  const { default: jsPDF } = await import("jspdf");
  const img = await dataUrlToImage(dataUrl);
  const orientation = img.width >= img.height ? "landscape" : "portrait";
  const pdf = new jsPDF({
    orientation,
    unit: "px",
    format: [img.width, img.height],
    compress: true,
  });
  pdf.addImage(dataUrl, "PNG", 0, 0, img.width, img.height);
  pdf.save(`${baseName}.pdf`);
}
