import { parseHexColor } from "@/lib/utils/colorUtils";

export type PngResidualOptions = {
  /** Reference background color (detected main background, fallback #FFFFFF). */
  backgroundColor?: string | null;
  /** RGB Euclidean tolerance for "this pixel is background". Defaults 24. */
  tolerance?: number;
  /** Halo ring width in px (1-2). Defaults 1. */
  haloRadius?: 1 | 2;
  /** Safety cap: abort if removal would exceed this fraction of opaque pixels. Defaults 0.95. */
  maxRemovalRatio?: number;
};

export type PngResidualResult = {
  removedPixels: number;
  haloPixelsSoftened: number;
  backgroundColor: string;
  aborted: boolean;
};

/**
 * Edge-connected white residual cleanup for transparent PNG canvases.
 *
 * Only removes near-white pixels that are connected (4-way) to the canvas
 * border through transparent or near-white pixels. Foreground whites that are
 * enclosed by colored artwork are never touched.
 *
 * Must run on a canvas that was rendered WITHOUT an opaque white fill
 * (transparent PNG path).
 */
export function cleanupPngWhiteResidual(
  canvas: HTMLCanvasElement,
  options: PngResidualOptions = {},
): PngResidualResult {
  const bg = parseHexColor(options.backgroundColor || "#FFFFFF") || { r: 255, g: 255, b: 255 };
  const tolerance = options.tolerance ?? 24;
  const haloRadius: number = options.haloRadius ?? 1;
  const maxRemovalRatio = options.maxRemovalRatio ?? 0.95;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return { removedPixels: 0, haloPixelsSoftened: 0, backgroundColor: "#FFFFFF", aborted: true };
  }

  const w = canvas.width;
  const h = canvas.height;
  if (w === 0 || h === 0) {
    return { removedPixels: 0, haloPixelsSoftened: 0, backgroundColor: "#FFFFFF", aborted: true };
  }

  const img = ctx.getImageData(0, 0, w, h);
  const data = img.data;
  const tol2 = tolerance * tolerance;

  const isNearBg = (idx: number): boolean => {
    const dr = data[idx] - bg.r;
    const dg = data[idx + 1] - bg.g;
    const db = data[idx + 2] - bg.b;
    return dr * dr + dg * dg + db * db <= tol2;
  };

  // Count opaque pixels for the safety guard.
  let opaqueTotal = 0;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] > 10) opaqueTotal++;
  }
  if (opaqueTotal === 0) {
    return { removedPixels: 0, haloPixelsSoftened: 0, backgroundColor: rgbToHex(bg), aborted: false };
  }

  const visited = new Uint8Array(w * h);
  const stack = new Int32Array(w * h);
  let head = 0;

  const push = (x: number, y: number) => {
    const pi = y * w + x;
    if (visited[pi]) return;
    visited[pi] = 1;
    stack[head++] = pi;
  };

  // Seed from all four borders.
  for (let x = 0; x < w; x++) {
    push(x, 0);
    push(x, h - 1);
  }
  for (let y = 1; y < h - 1; y++) {
    push(0, y);
    push(w - 1, y);
  }

  const toClear: number[] = [];

  while (head > 0) {
    const pi = stack[--head];
    const di = pi * 4;
    const alpha = data[di + 3];

    if (alpha <= 10) {
      // Transparent: traversable, expand to 4-neighbors.
      const x = pi % w;
      const y = (pi / w) | 0;
      if (x > 0) push(x - 1, y);
      if (x + 1 < w) push(x + 1, y);
      if (y > 0) push(x, y - 1);
      if (y + 1 < h) push(x, y + 1);
      continue;
    }

    if (!isNearBg(di)) continue; // colored artwork: stop flood here.

    toClear.push(pi);

    const x = pi % w;
    const y = (pi / w) | 0;
    if (x > 0) push(x - 1, y);
    if (x + 1 < w) push(x + 1, y);
    if (y > 0) push(x, y - 1);
    if (y + 1 < h) push(x, y + 1);
  }

  // Safety: never wipe the whole artwork (e.g. full-bleed white design with no border gap).
  if (toClear.length / opaqueTotal > maxRemovalRatio) {
    return { removedPixels: 0, haloPixelsSoftened: 0, backgroundColor: rgbToHex(bg), aborted: true };
  }

  for (const pi of toClear) {
    data[pi * 4 + 3] = 0;
  }

  // Anti-halo: clear near-white opaque pixels directly adjacent to transparency.
  let halo = 0;
  const radius = haloRadius >= 2 ? 2 : 1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const pi = y * w + x;
      if (data[pi * 4 + 3] <= 10) continue;
      const di = pi * 4;
      if (!isNearBg(di)) continue;
      let adjacentTransparent = false;
      outer: for (let dy = -radius; dy <= radius && !adjacentTransparent; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          if (data[(ny * w + nx) * 4 + 3] <= 10) {
            adjacentTransparent = true;
            break outer;
          }
        }
      }
      if (adjacentTransparent) {
        data[di + 3] = 0;
        halo++;
      }
    }
  }

  ctx.putImageData(img, 0, 0);

  return {
    removedPixels: toClear.length,
    haloPixelsSoftened: halo,
    backgroundColor: rgbToHex(bg),
    aborted: false,
  };
}

function rgbToHex(c: { r: number; g: number; b: number }): string {
  const t = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, "0")
      .toUpperCase();
  return `#${t(c.r)}${t(c.g)}${t(c.b)}`;
}
