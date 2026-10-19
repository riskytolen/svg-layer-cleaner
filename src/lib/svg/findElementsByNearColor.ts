import { normalizeColor, colorDistance } from "@/lib/utils/colorUtils";
import {
  resolveElementFill,
  extractCssFillRules,
  isExcludedElement,
  isElementVisible,
} from "./resolveElementFill";

export type NearColorMode = "fill" | "stroke" | "fill-and-stroke";

export type FindNearColorOptions = {
  mode: NearColorMode;
  /** RGB Euclidean tolerance (0 = exact match). */
  tolerance: number;
};

function getEffectiveStroke(element: Element): string | null {
  const attr = element.getAttribute("stroke");
  if (attr) {
    const n = normalizeColor(attr);
    if (n) return n;
    if (attr.toLowerCase() === "none") return null;
  }
  const style = element.getAttribute("style");
  if (style) {
    const m = style.match(/stroke\s*:\s*([^;]+)/i);
    if (m) {
      const n = normalizeColor(m[1].trim());
      if (n) return n;
    }
  }
  return null;
}

function withinTolerance(a: string | null, b: string | null, tolerance: number): boolean {
  if (a === null && b === null) return true;
  if (a === null || b === null) return false;
  if (tolerance <= 0) return a === b;
  const d = colorDistance(a, b);
  if (d === null) return false;
  return d <= tolerance;
}

/**
 * Tolerance-based same-color finder for manual batch review.
 * Unlike the exact-match `selectSameColor` helpers, this resolves fills
 * (attribute / inline style / CSS class / parent group) and matches colors
 * within an RGB Euclidean `tolerance`.
 *
 * Safety: skips root svg, system layers, locked layers, defs/mask/clipPath
 * content and invisible elements.
 */
export function findElementsByNearColor(
  doc: Document,
  sourceLayerId: string,
  options: FindNearColorOptions,
): string[] {
  const sourceEl = doc.querySelector(`[data-layer-id="${sourceLayerId}"]`);
  if (!sourceEl) return [];

  const cssRules = extractCssFillRules(doc);
  const sourceFill = resolveElementFill(sourceEl, cssRules);
  const sourceStroke = getEffectiveStroke(sourceEl);
  const { mode, tolerance } = options;

  if (mode === "fill" && !sourceFill) return [];
  if (mode === "stroke" && !sourceStroke) return [];
  if (mode === "fill-and-stroke" && !sourceFill && !sourceStroke) return [];

  const ids: string[] = [];
  const all = doc.querySelectorAll("path, rect, circle, ellipse, polygon, polyline, line, text");

  for (const el of Array.from(all)) {
    if (isExcludedElement(el)) continue;
    if (!isElementVisible(el)) continue;
    if (el === doc.documentElement) continue;

    const elFill = resolveElementFill(el, cssRules);
    const elStroke = getEffectiveStroke(el);

    let match = false;
    if (mode === "fill") {
      match = withinTolerance(elFill, sourceFill, tolerance);
    } else if (mode === "stroke") {
      match = withinTolerance(elStroke, sourceStroke, tolerance);
    } else {
      match =
        withinTolerance(elFill, sourceFill, tolerance) &&
        withinTolerance(elStroke, sourceStroke, tolerance);
    }

    if (match) {
      const id = el.getAttribute("data-layer-id");
      if (id) ids.push(id);
    }
  }

  return ids;
}

/** Resolve display fill/stroke of a layer for the review tools panel. */
export function getReviewLayerColors(
  doc: Document,
  layerId: string,
): { fill: string | null; stroke: string | null } {
  const el = doc.querySelector(`[data-layer-id="${layerId}"]`);
  if (!el) return { fill: null, stroke: null };
  const cssRules = extractCssFillRules(doc);
  return { fill: resolveElementFill(el, cssRules), stroke: getEffectiveStroke(el) };
}
