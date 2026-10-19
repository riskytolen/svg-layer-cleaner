import { normalizeColor, isNearWhite } from "@/lib/utils/colorUtils";
import {
  BACKGROUND_MODE_DEFAULTS,
  BackgroundDetectionOptions,
  WhiteBackgroundMode,
  defaultDetectionOptions,
  detectMainBackground,
  detectNearWhiteBackgroundCandidates,
} from "./backgroundDetection";

export type RemoveWhiteBackgroundOptions = {
  mode?: WhiteBackgroundMode;
  /** Per-channel tolerance for main background gate. Defaults 28. */
  whiteSensitivity?: number;
  /** RGB distance tolerance for residual candidates. Defaults 28. */
  colorTolerance?: number;
  /** Safety gate: only run when the detected main background is near-white. Defaults true. */
  onlyDeleteIfWhiteLike?: boolean;
  edgeMarginRatio?: number;
};

export type RemovedBackgroundDetail = {
  fill: string;
  score: number;
  reasons: string[];
};

export type AmbiguousBackgroundDetail = {
  fill: string;
  score: number;
  reasons: string[];
};

export type RemoveWhiteBackgroundResult = {
  mainBackgroundFill: string | null;
  normalizedFill: string | null;
  mainScore: number;
  mainReasons: string[];
  matchedCount: number;
  deletedCount: number;
  removedColors: Record<string, number>;
  removedDetails: RemovedBackgroundDetail[];
  ambiguousCount: number;
  ambiguousDetails: AmbiguousBackgroundDetail[];
  preservedNearWhite: number;
  skipped: boolean;
  warning?: string;
};

/**
 * Context-aware white background remover.
 *
 * Replaces the old exact-match `removeSameFillAsFirstPath`:
 * - detects the main background path (large, early, edge-touching, near-white),
 * - scores near-white candidates by color proximity + position + layer order + size,
 * - only removes high-confidence candidates, keeps foreground whites + ambiguous items.
 */
export function removeWhiteBackground(
  doc: Document,
  options: RemoveWhiteBackgroundOptions = {},
): RemoveWhiteBackgroundResult {
  const mode: WhiteBackgroundMode = options.mode ?? "balanced";
  const detection: BackgroundDetectionOptions = defaultDetectionOptions(mode, {
    whiteSensitivity: options.whiteSensitivity ?? 28,
    colorTolerance: options.colorTolerance ?? 28,
    edgeMarginRatio: options.edgeMarginRatio ?? 0.02,
  });
  const thresholds = BACKGROUND_MODE_DEFAULTS[mode];
  const onlyWhite = options.onlyDeleteIfWhiteLike ?? true;

  const result: RemoveWhiteBackgroundResult = {
    mainBackgroundFill: null,
    normalizedFill: null,
    mainScore: 0,
    mainReasons: [],
    matchedCount: 0,
    deletedCount: 0,
    removedColors: {},
    removedDetails: [],
    ambiguousCount: 0,
    ambiguousDetails: [],
    preservedNearWhite: 0,
    skipped: false,
  };

  const main = detectMainBackground(doc, detection);
  if (!main) {
    result.skipped = true;
    result.warning = "No high-confidence white background found. File skipped for safety.";
    return result;
  }

  if (onlyWhite && !isNearWhite(main.fill, detection.whiteSensitivity)) {
    result.skipped = true;
    result.warning = "Main background is not white-like. File skipped for safety.";
    return result;
  }

  const normalized = normalizeColor(main.fill);
  result.mainBackgroundFill = main.fill;
  result.normalizedFill = normalized;
  result.mainScore = main.score;
  result.mainReasons = main.reasons;

  const candidates = detectNearWhiteBackgroundCandidates(doc, main.fill, detection, main.element);

  const toRemove: typeof candidates = [];
  const ambiguous: typeof candidates = [];

  for (const c of candidates) {
    if (c.score >= thresholds.highThreshold) {
      toRemove.push(c);
    } else if (c.score >= thresholds.ambiguousThreshold) {
      ambiguous.push(c);
    } else {
      result.preservedNearWhite++;
    }
  }

  // Main background element itself is always high-confidence.
  result.matchedCount = toRemove.length + 1;

  const removeOne = (el: Element, fill: string, score: number, reasons: string[]) => {
    if (!el.parentNode) return false;
    el.parentNode.removeChild(el);
    result.deletedCount++;
    const key = (normalizeColor(fill) || fill).toUpperCase();
    result.removedColors[key] = (result.removedColors[key] || 0) + 1;
    result.removedDetails.push({ fill: key, score, reasons });
    return true;
  };

  removeOne(main.element, main.fill, main.score, main.reasons);
  for (const c of toRemove) {
    // Element may already be gone if nested inside the removed main path (rare).
    if (!c.element.parentNode) continue;
    // Re-check attachment to the document to avoid double removal.
    if (!doc.contains(c.element)) continue;
    removeOne(c.element, c.fill, c.score, c.reasons);
  }

  result.ambiguousCount = ambiguous.length;
  result.ambiguousDetails = ambiguous.slice(0, 20).map((c) => ({
    fill: (normalizeColor(c.fill) || c.fill).toUpperCase(),
    score: Math.round(c.score),
    reasons: c.reasons,
  }));

  return result;
}

/** Back-compat alias for the legacy remover name (deprecated, maps to balanced mode). */
export function removeSameFillAsFirstPathCompat(
  doc: Document,
  options: { colorTolerance?: number; whiteTolerance?: number; onlyDeleteIfWhiteLike?: boolean },
) {
  return removeWhiteBackground(doc, {
    mode: "balanced",
    colorTolerance: options.colorTolerance ?? 28,
    whiteSensitivity: options.whiteTolerance ?? 28,
    onlyDeleteIfWhiteLike: options.onlyDeleteIfWhiteLike ?? true,
  });
}
