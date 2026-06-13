import { normalizeColor } from "@/lib/utils/colorUtils";
import {
  resolveElementFill,
  extractCssFillRules,
  isExcludedElement,
  isElementVisible,
} from "./resolveElementFill";
import { findFirstProcessablePathAfterClean } from "./findFirstPathInGroup";
import { FirstPathScope } from "@/lib/batch/batchTypes";

const VISUAL_TAGS = new Set(["path", "rect", "circle", "ellipse", "polygon", "polyline", "line", "text"]);

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

  const cssRules = extractCssFillRules(doc);

  // Find first processable path (with resolved fill)
  const path1 = findFirstProcessablePathAfterClean(doc);
  if (!path1) {
    result.warning = "No valid path with resolved fill found after quick clean.";
    result.skipped = true;
    return result;
  }

  result.path1Element = path1;

  // Resolve fill color (supports attribute, inline style, CSS class, parent group)
  const fill = resolveElementFill(path1, cssRules);
  if (!fill) {
    // Log debug info
    const rawFill = path1.getAttribute("fill");
    const classAttr = path1.getAttribute("class");
    const parentFill = path1.parentElement?.getAttribute("fill") || null;

    result.warning = [
      "First valid path has no resolved fill color.",
      `rawFill=${rawFill}, class=${classAttr}, parentFill=${parentFill}`,
    ].join(" ");
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
    if (VISUAL_TAGS.has(el.tagName.toLowerCase()) && isExcludedElement(el)) continue;
    if (!VISUAL_TAGS.has(el.tagName.toLowerCase())) continue;
    if (!isElementVisible(el)) continue;

    const elFill = resolveElementFill(el, cssRules);
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
