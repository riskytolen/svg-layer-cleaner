import { normalizeColor, isNearColor, isNearWhite, parseHexColor } from "@/lib/utils/colorUtils";
import {
  resolveElementFill,
  extractCssFillRules,
  isExcludedElement,
  isElementVisible,
} from "./resolveElementFill";

export type WhiteBackgroundMode = "safe" | "balanced" | "aggressive";

export type ViewBoxRect = { minX: number; minY: number; width: number; height: number };

export type BackgroundDetectionOptions = {
  mode: WhiteBackgroundMode;
  /** Per-channel tolerance for "is this near-white at all" (0-100). */
  whiteSensitivity: number;
  /** RGB Euclidean tolerance for "is this near the main background color". */
  colorTolerance: number;
  /** Fraction of viewBox dimension used as edge-touch margin (0-0.2). */
  edgeMarginRatio: number;
};

export const BACKGROUND_MODE_DEFAULTS: Record<
  WhiteBackgroundMode,
  { highThreshold: number; ambiguousThreshold: number }
> = {
  safe: { highThreshold: 80, ambiguousThreshold: 55 },
  balanced: { highThreshold: 65, ambiguousThreshold: 40 },
  aggressive: { highThreshold: 50, ambiguousThreshold: 30 },
};

export function defaultDetectionOptions(
  mode: WhiteBackgroundMode,
  overrides?: Partial<BackgroundDetectionOptions>,
): BackgroundDetectionOptions {
  return {
    mode,
    whiteSensitivity: 28,
    colorTolerance: 28,
    edgeMarginRatio: 0.02,
    ...overrides,
  };
}

const VISUAL_TAGS = new Set([
  "path",
  "rect",
  "circle",
  "ellipse",
  "polygon",
  "polyline",
  "line",
  "text",
]);

export function getVisualElements(doc: Document): Element[] {
  const all = doc.querySelectorAll("path, rect, circle, ellipse, polygon, polyline, line, text");
  const out: Element[] = [];
  for (const el of Array.from(all)) {
    if (!VISUAL_TAGS.has(el.tagName.toLowerCase())) continue;
    if (isExcludedElement(el)) continue;
    if (!isElementVisible(el)) continue;
    out.push(el);
  }
  return out;
}

export function parseViewBoxRect(doc: Document): ViewBoxRect {
  const root = doc.documentElement;
  const vb = root.getAttribute("viewBox");
  if (vb) {
    const parts = vb.trim().split(/[\s,]+/).map(Number);
    if (parts.length === 4 && parts.every((p) => !isNaN(p)) && parts[2] > 0 && parts[3] > 0) {
      return { minX: parts[0], minY: parts[1], width: parts[2], height: parts[3] };
    }
  }
  const w = parseFloat((root.getAttribute("width") || "").replace(/(px|pt)$/i, ""));
  const h = parseFloat((root.getAttribute("height") || "").replace(/(px|pt)$/i, ""));
  if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) {
    return { minX: 0, minY: 0, width: w, height: h };
  }
  return { minX: 0, minY: 0, width: 2500, height: 2500 };
}

export type BBox = { x: number; y: number; w: number; h: number };

function numbersFromString(s: string): number[] {
  const m = s.match(/-?\d+(?:\.\d+)?(?:e-?\d+)?/gi);
  if (!m) return [];
  return m.map(Number).filter((n) => !isNaN(n));
}

/**
 * Endpoint-tracking BBox for path `d`.
 * Walks commands and accumulates the current point so relative (lowercase)
 * commands resolve to absolute endpoints. Curve control points are ignored
 * (endpoint BBox slightly underestimates true bounds; the edge margin
 * absorbs the difference). Far more reliable than pairing raw numbers.
 */
function estimatePathBBox(d: string): BBox | null {
  if (!d) return null;
  const segments = d.match(/[MmLlHhVvCcSsQqTtAaZz][^MmLlHhVvCcSsQqTtAaZz]*/g);
  if (!segments) return null;

  let cx = 0;
  let cy = 0;
  let subX = 0;
  let subY = 0;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let hasPoint = false;

  const put = (x: number, y: number) => {
    if (!isFinite(x) || !isFinite(y)) return;
    hasPoint = true;
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  };

  for (const seg of segments) {
    const cmd = seg[0];
    const relative = cmd >= "a" && cmd <= "z";
    const nums = numbersFromString(seg.slice(1));
    const upper = cmd.toUpperCase();

    if (upper === "Z") {
      cx = subX;
      cy = subY;
      continue;
    }

    if (upper === "M") {
      for (let i = 0; i + 1 < nums.length; i += 2) {
        const x = relative ? cx + nums[i] : nums[i];
        const y = relative ? cy + nums[i + 1] : nums[i + 1];
        cx = x;
        cy = y;
        if (i === 0) {
          subX = x;
          subY = y;
        }
        put(x, y);
      }
      continue;
    }

    if (upper === "L" || upper === "T") {
      for (let i = 0; i + 1 < nums.length; i += 2) {
        const x = relative ? cx + nums[i] : nums[i];
        const y = relative ? cy + nums[i + 1] : nums[i + 1];
        cx = x;
        cy = y;
        put(x, y);
      }
      continue;
    }

    if (upper === "H") {
      for (const n of nums) {
        cx = relative ? cx + n : n;
        put(cx, cy);
      }
      continue;
    }

    if (upper === "V") {
      for (const n of nums) {
        cy = relative ? cy + n : n;
        put(cx, cy);
      }
      continue;
    }

    const groupSize = upper === "C" ? 6 : upper === "A" ? 7 : 4; // C/S/Q/A
    if (upper === "C" || upper === "S" || upper === "Q" || upper === "A") {
      for (let i = 0; i + groupSize - 1 < nums.length; i += groupSize) {
        const ex = nums[i + groupSize - 2];
        const ey = nums[i + groupSize - 1];
        cx = relative ? cx + ex : ex;
        cy = relative ? cy + ey : ey;
        put(cx, cy);
      }
      continue;
    }
  }

  if (!hasPoint) return null;
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

/** Crude BBox estimate without a layout engine (enough for edge-touch + size heuristics). */
export function estimateElementBBox(el: Element): BBox | null {
  const tag = el.tagName.toLowerCase();
  try {
    if (tag === "rect") {
      const x = parseFloat(el.getAttribute("x") || "0") || 0;
      const y = parseFloat(el.getAttribute("y") || "0") || 0;
      const w = parseFloat(el.getAttribute("width") || "0") || 0;
      const h = parseFloat(el.getAttribute("height") || "0") || 0;
      if (w <= 0 || h <= 0) return null;
      return { x, y, w, h };
    }
    if (tag === "circle") {
      const cx = parseFloat(el.getAttribute("cx") || "0") || 0;
      const cy = parseFloat(el.getAttribute("cy") || "0") || 0;
      const r = parseFloat(el.getAttribute("r") || "0") || 0;
      if (r <= 0) return null;
      return { x: cx - r, y: cy - r, w: r * 2, h: r * 2 };
    }
    if (tag === "ellipse") {
      const cx = parseFloat(el.getAttribute("cx") || "0") || 0;
      const cy = parseFloat(el.getAttribute("cy") || "0") || 0;
      const rx = parseFloat(el.getAttribute("rx") || "0") || 0;
      const ry = parseFloat(el.getAttribute("ry") || "0") || 0;
      if (rx <= 0 || ry <= 0) return null;
      return { x: cx - rx, y: cy - ry, w: rx * 2, h: ry * 2 };
    }
    if (tag === "line") {
      const x1 = parseFloat(el.getAttribute("x1") || "0") || 0;
      const y1 = parseFloat(el.getAttribute("y1") || "0") || 0;
      const x2 = parseFloat(el.getAttribute("x2") || "0") || 0;
      const y2 = parseFloat(el.getAttribute("y2") || "0") || 0;
      return { x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1), h: Math.abs(y2 - y1) };
    }
    if (tag === "polygon" || tag === "polyline") {
      const nums = numbersFromString(el.getAttribute("points") || "");
      if (nums.length < 4) return null;
      const xs: number[] = [];
      const ys: number[] = [];
      for (let i = 0; i + 1 < nums.length; i += 2) {
        xs.push(nums[i]);
        ys.push(nums[i + 1]);
      }
      if (xs.length === 0) return null;
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
    }
    if (tag === "path") {
      return estimatePathBBox(el.getAttribute("d") || "");
    }
  } catch {
    return null;
  }
  return null;
}

export function touchesViewBoxEdge(bbox: BBox | null, viewBox: ViewBoxRect, edgeMarginRatio: number): boolean {
  if (!bbox) return false;
  const mx = viewBox.width * edgeMarginRatio;
  const my = viewBox.height * edgeMarginRatio;
  const left = viewBox.minX;
  const top = viewBox.minY;
  const right = viewBox.minX + viewBox.width;
  const bottom = viewBox.minY + viewBox.height;
  return (
    bbox.x <= left + mx ||
    bbox.y <= top + my ||
    bbox.x + bbox.w >= right - mx ||
    bbox.y + bbox.h >= bottom - my
  );
}

export function countTouchedEdges(
  bbox: BBox | null,
  viewBox: ViewBoxRect,
  edgeMarginRatio: number,
): number {
  if (!bbox) return 0;
  const mx = viewBox.width * edgeMarginRatio;
  const my = viewBox.height * edgeMarginRatio;
  const left = viewBox.minX;
  const top = viewBox.minY;
  const right = viewBox.minX + viewBox.width;
  const bottom = viewBox.minY + viewBox.height;
  let n = 0;
  if (bbox.x <= left + mx) n++;
  if (bbox.y <= top + my) n++;
  if (bbox.x + bbox.w >= right - mx) n++;
  if (bbox.y + bbox.h >= bottom - my) n++;
  return n;
}

function getEffectiveStroke(el: Element): string | null {
  const attr = el.getAttribute("stroke");
  if (attr) {
    const n = normalizeColor(attr);
    if (n) return n;
    if (attr.toLowerCase() === "none") return null;
  }
  const style = el.getAttribute("style");
  if (style) {
    const m = style.match(/stroke\s*:\s*([^;]+)/i);
    if (m) {
      const n = normalizeColor(m[1].trim());
      if (n) return n;
    }
  }
  return null;
}

function elementDepth(el: Element): number {
  let d = 0;
  let cur = el.parentElement;
  while (cur) {
    if (cur.tagName.toLowerCase() === "g") d++;
    if (cur.tagName.toLowerCase() === "svg") break;
    cur = cur.parentElement;
  }
  return d;
}

function describeLayer(el: Element): string {
  return [
    el.tagName.toLowerCase(),
    el.getAttribute("id") || "",
    el.getAttribute("data-layer-id") || "",
    el.getAttribute("data-name") || "",
  ]
    .join(" ")
    .toLowerCase();
}

function looksLikeBackgroundLayerName(el: Element): boolean {
  const s = describeLayer(el);
  let cur: Element | null = el.parentElement;
  let combined = s;
  while (cur && combined.length < 300) {
    if (cur.tagName.toLowerCase() === "g" || cur.tagName.toLowerCase() === "svg") {
      combined +=
        " " +
        [
          cur.getAttribute("id") || "",
          cur.getAttribute("data-name") || "",
          cur.getAttribute("inkscape:label") || "",
        ]
          .join(" ")
          .toLowerCase();
    }
    if (cur.tagName.toLowerCase() === "svg") break;
    cur = cur.parentElement;
  }
  return /(^|[^a-z])(background|bg|canvas|page|artboard|backdrop)($|[^a-z])/.test(combined);
}

export type MainBackgroundCandidate = {
  element: Element;
  index: number;
  fill: string;
  score: number;
  reasons: string[];
};

export function detectMainBackground(
  doc: Document,
  options: BackgroundDetectionOptions,
): MainBackgroundCandidate | null {
  const cssRules = extractCssFillRules(doc);
  const viewBox = parseViewBoxRect(doc);
  const viewBoxArea = viewBox.width * viewBox.height;
  const elements = getVisualElements(doc);

  let best: MainBackgroundCandidate | null = null;

  for (let index = 0; index < elements.length; index++) {
    const el = elements[index];
    const fill = resolveElementFill(el, cssRules);
    if (!fill) continue;
    if (!isNearWhite(fill, options.whiteSensitivity)) continue;

    const bbox = estimateElementBBox(el);
    const area = bbox ? bbox.w * bbox.h : 0;
    const areaRatio = viewBoxArea > 0 ? area / viewBoxArea : 0;
    const touchedEdges = countTouchedEdges(bbox, viewBox, options.edgeMarginRatio);
    const stroke = getEffectiveStroke(el);
    const dLen = el.tagName.toLowerCase() === "path" ? (el.getAttribute("d") || "").length : 0;

    let score = 0;
    const reasons: string[] = ["near-white"];

    if (index < 5) {
      score += 50;
      reasons.push("first-layer");
    } else if (index < 15) {
      score += 30;
      reasons.push("early-layer");
    } else if (index < 40) {
      score += 10;
      reasons.push("early-doc");
    }

    if (areaRatio >= 0.5) {
      score += 30;
      reasons.push("large-area");
    } else if (areaRatio >= 0.2) {
      score += 15;
      reasons.push("medium-area");
    }

    if (touchedEdges >= 2) {
      score += 20;
      reasons.push("touches-edges");
    } else if (touchedEdges === 1) {
      score += 8;
      reasons.push("touches-edge");
    }

    if (el.tagName.toLowerCase() === "rect" && areaRatio >= 0.5) {
      score += 10;
      reasons.push("page-rect");
    }
    if (dLen > 2000) {
      score += 10;
      reasons.push("complex-path");
    }

    if (stroke && isNearColor(fill, stroke, 8)) {
      score += 8;
      reasons.push("fill-stroke-match");
    }

    if (looksLikeBackgroundLayerName(el)) {
      score += 15;
      reasons.push("bg-layer-name");
    }

    if (!bbox) {
      score -= 10;
    }

    if (!best || score > best.score) {
      best = { element: el, index, fill, score, reasons };
    }
  }

  if (!best || best.score < 40) return null;
  return best;
}

export type NearWhiteCandidate = {
  element: Element;
  index: number;
  fill: string;
  colorDistance: number;
  score: number;
  reasons: string[];
  bbox: BBox | null;
  touchesEdge: boolean;
};

export function detectNearWhiteBackgroundCandidates(
  doc: Document,
  mainFill: string,
  options: BackgroundDetectionOptions,
  exclude?: Element | null,
): NearWhiteCandidate[] {
  const cssRules = extractCssFillRules(doc);
  const viewBox = parseViewBoxRect(doc);
  const viewBoxArea = viewBox.width * viewBox.height;
  const elements = getVisualElements(doc);
  const out: NearWhiteCandidate[] = [];

  for (let index = 0; index < elements.length; index++) {
    const el = elements[index];
    if (exclude && el === exclude) continue;
    const fill = resolveElementFill(el, cssRules);
    if (!fill) continue;

    // Must be similar to the detected main background color (protects cream foreground
    // that is near-white in absolute terms but a different tint).
    const dist = (() => {
      const a = parseHexColor(fill);
      const b = parseHexColor(mainFill);
      if (!a || !b) return null;
      const dr = a.r - b.r;
      const dg = a.g - b.g;
      const db = a.b - b.b;
      return Math.sqrt(dr * dr + dg * dg + db * db);
    })();
    if (dist === null || dist > options.colorTolerance) continue;

    const bbox = estimateElementBBox(el);
    const area = bbox ? bbox.w * bbox.h : 0;
    const areaRatio = viewBoxArea > 0 ? area / viewBoxArea : 0;
    const touchesEdge = touchesViewBoxEdge(bbox, viewBox, options.edgeMarginRatio);
    const stroke = getEffectiveStroke(el);
    const depth = elementDepth(el);
    const dLen = el.tagName.toLowerCase() === "path" ? (el.getAttribute("d") || "").length : 0;

    let score = 0;
    const reasons: string[] = [];

    if (dist <= options.colorTolerance * 0.5) {
      score += 40;
      reasons.push("color-match");
    } else {
      score += 25;
      reasons.push("color-near");
    }

    if (touchesEdge) {
      score += 25;
      reasons.push("touches-edge");
    }

    if (index < 10) {
      score += 20;
      reasons.push("early-layer");
    } else if (index < 30) {
      score += 10;
      reasons.push("early-doc");
    }

    if (areaRatio >= 0.2) {
      score += 15;
      reasons.push("large-area");
    } else if (areaRatio >= 0.05) {
      score += 8;
      reasons.push("medium-area");
    } else if (areaRatio > 0 && areaRatio < 0.005 && !touchesEdge) {
      score -= 40;
      reasons.push("small-interior");
    }

    if (dLen > 3000) {
      score += 5;
      reasons.push("complex-path");
    }

    if (stroke && isNearColor(fill, stroke, 8)) {
      score += 10;
      reasons.push("fill-stroke-match");
    }

    if (looksLikeBackgroundLayerName(el)) {
      score += 10;
      reasons.push("bg-layer-name");
    }

    if (depth > 4) {
      score -= 10;
      reasons.push("deep-nesting");
    }

    if (!bbox) {
      score -= 10;
      reasons.push("no-bbox");
    }

    out.push({
      element: el,
      index,
      fill,
      colorDistance: dist,
      score,
      reasons,
      bbox,
      touchesEdge,
    });
  }

  return out.sort((a, b) => b.score - a.score);
}
