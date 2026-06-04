import { slugify } from "./slug";

export type DownloadKind = "png" | "pdf";

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
