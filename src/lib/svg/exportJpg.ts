import { downloadBlob } from "@/lib/utils/downloadFile";

export async function exportSvgToJpg(
  svgText: string,
  options: {
    width: number;
    height: number;
    scale: number;
    quality: number;
    backgroundColor: string;
  },
  fileName: string,
): Promise<void> {
  const { width, height, scale, quality, backgroundColor } = options;
  const canvasWidth = width * scale;
  const canvasHeight = height * scale;

  // Check for external images
  if (svgText.includes("<image") && (svgText.includes("http://") || svgText.includes("https://"))) {
    throw new Error("SVG contains external images and cannot be exported to canvas.");
  }

  const blob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  try {
    const img = await loadImage(url);

    const canvas = document.createElement("canvas");
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Failed to create canvas context.");

    // Fill white background (JPG doesn't support transparency)
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Draw SVG on top
    ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);

    // Convert to JPG blob
    const jpgBlob = await canvasToBlob(canvas, "image/jpeg", quality);
    downloadBlob(jpgBlob, fileName);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load SVG as image."));
    img.src = url;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to convert canvas to blob."));
      },
      type,
      quality,
    );
  });
}
