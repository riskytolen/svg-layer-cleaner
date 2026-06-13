import { normalizeColor } from "@/lib/utils/colorUtils";
import { findFirstPathInGroup } from "./findFirstPathInGroup";
import { FirstPathScope } from "@/lib/batch/batchTypes";

const EXCLUDED_TAGS = new Set(["svg", "defs", "clippath", "mask", "pattern", "lineargradient", "radialgradient", "symbol"]);

function getElementFill(element: Element): string | null {
  const attr = element.getAttribute("fill");
  if (attr) {
    const norm = normalizeColor(attr);
    if (norm) return norm;
  }

  const style = element.getAttribute("style");
  if (style) {
    const match = style.match(/fill\s*:\s*([^;]+)/);
    if (match) {
      const norm = normalizeColor(match[1].trim());
      if (norm) return norm;
    }
  }

  return null;
}

export function isWhiteLikeColor(color: string, tolerance: number): boolean {
  const hex = normalizeColor(color);
  if (!hex || hex.length !== 7) return false;

  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  return r >= 255 - tolerance && g >= 255 - tolerance && b >= 255 - tolerance;
}

export function removeSameFillAsFirstPath(
  doc: Document,
  options: {
    scope: FirstPathScope;
    onlyDeleteIfWhiteLike: boolean;
    whiteTolerance: number;
  },
): {
  path1Element: Element | null;
  path1Fill: string | null;
  normalizedFill: string | null;
  matchedCount: number;
  deletedCount: number;
  skipped: boolean;
  warning?: string;
} {
  const result = {
    path1Element: null as Element | null,
    path1Fill: null as string | null,
    normalizedFill: null as string | null,
    matchedCount: 0,
    deletedCount: 0,
    skipped: false,
    warning: undefined as string | undefined,
  };

  const path1 = findFirstPathInGroup(doc, { scope: options.scope });
  if (!path1) {
    result.warning = "No path found in specified scope.";
    result.skipped = true;
    return result;
  }

  result.path1Element = path1;

  const fill = getElementFill(path1);
  if (!fill) {
    result.warning = "First path has no fill color.";
    result.skipped = true;
    return result;
  }

  result.path1Fill = fill;
  result.normalizedFill = normalizeColor(fill);

  if (options.onlyDeleteIfWhiteLike) {
    if (!isWhiteLikeColor(fill, options.whiteTolerance)) {
      result.warning = "First path color is not white-like. File skipped for safety.";
      result.skipped = true;
      return result;
    }
  }

  const normalizedFill = normalizeColor(fill);
  if (!normalizedFill) {
    result.warning = "Cannot normalize fill color.";
    result.skipped = true;
    return result;
  }

  // Collect all elements with same fill
  const allElements = doc.querySelectorAll("path, rect, circle, ellipse, polygon, polyline, line, text");
  const toRemove: Element[] = [];

  for (const el of Array.from(allElements)) {
    if (EXCLUDED_TAGS.has(el.tagName.toLowerCase())) continue;
    if (el.closest("defs")) continue;
    if (el.closest("clippath")) continue;
    if (el.closest("mask")) continue;
    if (el.getAttribute("data-system-layer")) continue;
    if (el.getAttribute("data-locked") === "true") continue;
    if (el === doc.documentElement) continue;

    const elFill = getElementFill(el);
    if (elFill === normalizedFill) {
      toRemove.push(el);
    }
  }

  result.matchedCount = toRemove.length;

  // Remove matched elements
  for (const el of toRemove) {
    el.parentNode?.removeChild(el);
    result.deletedCount++;
  }

  return result;
}
