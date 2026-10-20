/**
 * Plain-JSON review project file: serialization, validation and the export
 * scope filter. DOM-free on purpose so it can run in unit tests without a
 * browser; SVG text is re-parsed into Documents during restore.
 */
import type {
  BatchReviewItem,
  BatchReviewStatus,
  ExportFormat,
  FirstPathScope,
  WhiteBackgroundMode,
} from "@/lib/batch/batchTypes";

export type ReviewExportScope = "reviewed-only" | "all-eligible";

export type ReviewColorPropertyForProject = "fill" | "stroke";

export type SerializedProjectOptions = {
  exportFormats: ExportFormat[];
  autoResize2500: boolean;
  quickClean: boolean;
  removeWhiteBackground: boolean;
  backgroundMode: WhiteBackgroundMode;
  backgroundColorTolerance: number;
  firstPathScope: FirstPathScope;
  onlyDeleteIfWhiteLike: boolean;
  whiteTolerance: number;
  cleanPngResidual: boolean;
  pngResidualTolerance: number;
  skipSystemLayers: boolean;
  overwriteExisting: boolean;
  pngTransparent: boolean;
  jpgQuality: number;
  manualReview: boolean;
  reviewColorTolerance: number;
  reviewCanvas: "black" | "checkerboard" | "white";
};

export type SerializedReviewItem = {
  id: string;
  fileName: string;
  inputPath?: string;
  svgText: string;
  bgColor?: string | null;
  autoDeletedCount: number;
  manualDeletedCount: number;
  ambiguousCount: number;
  preservedNearWhite: number;
  removedColors?: Record<string, number>;
  history: string[];
  status: BatchReviewStatus;
  beforeSize?: number;
};

export type SerializedReviewSelection = {
  layerId: string | null;
  layerIds: string[];
};

export type ReviewProjectFile = {
  formatVersion: number;
  createdAt: number;
  savedAt: number;
  /** Name shown in prompts/Downloads, usually the input folder name. */
  sourceName: string | null;
  items: SerializedReviewItem[];
  activeItemIndex: number | null;
  activeSelection: SerializedReviewSelection | null;
  exportScope: ReviewExportScope;
  reviewFilter: string;
  reviewSearchQuery: string;
  reviewColorProperty: ReviewColorPropertyForProject;
  reviewEditColor: string | null;
  options: SerializedProjectOptions;
};

export const PROJECT_FORMAT_VERSION = 1;

/** Undo steps saved per asset in project files and autosave drafts. */
export const MAX_SAVED_HISTORY_STEPS = 10;

export const EXPORT_SCOPES: readonly ReviewExportScope[] = ["reviewed-only", "all-eligible"];

export type ReviewProjectStateInput = {
  sourceName: string | null;
  items: BatchReviewItem[];
  activeItemIndex: number | null;
  activeSelection: SerializedReviewSelection | null;
  exportScope: ReviewExportScope;
  reviewFilter: string;
  reviewSearchQuery: string;
  reviewColorProperty: ReviewColorPropertyForProject;
  reviewEditColor: string | null;
  options: SerializedProjectOptions;
};

export function trimReviewHistory(history: readonly string[]): string[] {
  if (history.length <= MAX_SAVED_HISTORY_STEPS) return history.map((h) => h);
  return history.slice(-MAX_SAVED_HISTORY_STEPS).map((h) => h);
}

export function serializeReviewProject(input: ReviewProjectStateInput): ReviewProjectFile {
  const now = Date.now();
  return {
    formatVersion: PROJECT_FORMAT_VERSION,
    createdAt: now,
    savedAt: now,
    sourceName: typeof input.sourceName === "string" && input.sourceName.trim() ? input.sourceName : null,
    items: input.items.map((item) => serializeReviewItem(item)),
    activeItemIndex: input.activeItemIndex,
    activeSelection: input.activeSelection,
    exportScope: EXPORT_SCOPES.includes(input.exportScope) ? input.exportScope : "reviewed-only",
    reviewFilter: typeof input.reviewFilter === "string" ? input.reviewFilter : "all",
    reviewSearchQuery: typeof input.reviewSearchQuery === "string" ? input.reviewSearchQuery : "",
    reviewColorProperty: input.reviewColorProperty === "stroke" ? "stroke" : "fill",
    reviewEditColor: typeof input.reviewEditColor === "string" ? input.reviewEditColor : null,
    options: { ...input.options },
  };
}

function serializeReviewItem(item: BatchReviewItem): SerializedReviewItem {
  return {
    id: item.id,
    fileName: item.fileName,
    inputPath: item.inputPath,
    svgText: item.svgText,
    bgColor: item.bgColor ?? null,
    autoDeletedCount: item.autoDeletedCount,
    manualDeletedCount: item.manualDeletedCount,
    ambiguousCount: item.ambiguousCount,
    preservedNearWhite: item.preservedNearWhite,
    removedColors: item.removedColors,
    history: trimReviewHistory(item.history),
    status: item.status,
    beforeSize: item.beforeSize,
  };
}

// ---------- Export scope filter ----------

export type ExportScopeSummary<T> = {
  exportable: T[];
  pendingCount: number;
  reviewedCount: number;
};

/**
 * reviewed-only → strictly assets marked reviewed.
 * all-eligible  → pending + reviewed (rejected assets always stay out).
 */
export function selectExportableReviewItems<T extends { status: BatchReviewStatus }>(
  items: readonly T[],
  scope: ReviewExportScope,
): ExportScopeSummary<T> {
  const exportable =
    scope === "reviewed-only"
      ? items.filter((r) => r.status === "reviewed")
      : items.filter((r) => r.status !== "skipped");
  return {
    exportable: exportable.map((r) => r),
    pendingCount: exportable.filter((r) => r.status === "pending-review").length,
    reviewedCount: items.filter((r) => r.status === "reviewed").length,
  };
}

// ---------- Validation ----------

const REVIEW_STATUSES: readonly BatchReviewStatus[] = ["pending-review", "reviewed", "skipped"];
const REVIEW_FILTERS = ["all", "pending", "reviewed", "skipped", "ambiguous"];
const EXPORT_FORMATS: readonly ExportFormat[] = ["svg", "png", "jpg", "eps"];

export type ProjectValidationResult =
  | { ok: true; project: ReviewProjectFile }
  | { ok: false; error: string };

export function validateReviewProjectFile(raw: unknown): ProjectValidationResult {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, error: "Project file is not a valid object." };
  }
  const data = raw as Record<string, unknown>;
  if (data.formatVersion !== PROJECT_FORMAT_VERSION) {
    return {
      ok: false,
      error: `Unsupported project format (found ${String(data.formatVersion)}, expected ${PROJECT_FORMAT_VERSION}).`,
    };
  }

  const rawItems = data.items;
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return { ok: false, error: "Project contains no review assets." };
  }

  const items: SerializedReviewItem[] = [];
  const seenIds = new Set<string>();
  for (const rawItem of rawItems) {
    if (!rawItem || typeof rawItem !== "object" || Array.isArray(rawItem)) {
      return { ok: false, error: "Project contains a damaged asset entry." };
    }
    const item = rawItem as Record<string, unknown>;
    const id = typeof item.id === "string" && item.id.trim() ? item.id : "";
    const fileName = typeof item.fileName === "string" && item.fileName.trim() ? item.fileName : "";
    const svgText = typeof item.svgText === "string" ? item.svgText : "";
    if (!id || !fileName) {
      return { ok: false, error: "Project asset is missing an id or file name." };
    }
    if (seenIds.has(id)) {
      return { ok: false, error: `Duplicate asset id in project: ${id}.` };
    }
    seenIds.add(id);
    if (!svgText.includes("<svg")) {
      return { ok: false, error: `${fileName}: stored SVG data is missing or damaged.` };
    }
    const status = REVIEW_STATUSES.includes(item.status as BatchReviewStatus)
      ? (item.status as BatchReviewStatus)
      : "pending-review";
    const history = Array.isArray(item.history)
      ? item.history.filter((h): h is string => typeof h === "string" && h.includes("<svg"))
      : [];
    items.push({
      id,
      fileName,
      inputPath: typeof item.inputPath === "string" ? item.inputPath : undefined,
      svgText,
      bgColor: typeof item.bgColor === "string" ? item.bgColor : null,
      autoDeletedCount: toNonNegativeInt(item.autoDeletedCount),
      manualDeletedCount: toNonNegativeInt(item.manualDeletedCount),
      ambiguousCount: toNonNegativeInt(item.ambiguousCount),
      preservedNearWhite: toNonNegativeInt(item.preservedNearWhite),
      removedColors: sanitizeRemovedColors(item.removedColors),
      history: history.slice(-MAX_SAVED_HISTORY_STEPS),
      status,
      beforeSize: toNonNegativeIntOrUndefined(item.beforeSize),
    });
  }

  const activeItemIndexRaw = data.activeItemIndex;
  let activeItemIndex: number | null = null;
  if (typeof activeItemIndexRaw === "number" && Number.isInteger(activeItemIndexRaw)) {
    activeItemIndex = activeItemIndexRaw >= 0 && activeItemIndexRaw < items.length ? activeItemIndexRaw : null;
  }

  const options = sanitizeReviewOptions(data.options);

  return {
    ok: true,
    project: {
      formatVersion: PROJECT_FORMAT_VERSION,
      createdAt: toNonNegativeInt(data.createdAt) || Date.now(),
      savedAt: toNonNegativeInt(data.savedAt) || Date.now(),
      sourceName: typeof data.sourceName === "string" && data.sourceName.trim() ? data.sourceName : null,
      items,
      activeItemIndex,
      activeSelection: sanitizeSelection(data.activeSelection),
      exportScope: EXPORT_SCOPES.includes(data.exportScope as ReviewExportScope)
        ? (data.exportScope as ReviewExportScope)
        : "reviewed-only",
      reviewFilter: REVIEW_FILTERS.includes(data.reviewFilter as string) ? (data.reviewFilter as string) : "all",
      reviewSearchQuery: typeof data.reviewSearchQuery === "string" ? data.reviewSearchQuery : "",
      reviewColorProperty: data.reviewColorProperty === "stroke" ? "stroke" : "fill",
      reviewEditColor: typeof data.reviewEditColor === "string" ? data.reviewEditColor : null,
      options,
    },
  };
}

function sanitizeSelection(raw: unknown): SerializedReviewSelection | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const data = raw as Record<string, unknown>;
  const layerIds = Array.isArray(data.layerIds)
    ? data.layerIds.filter((s): s is string => typeof s === "string" && !!s).slice(0, 5000)
    : [];
  return {
    layerId: typeof data.layerId === "string" && data.layerId ? data.layerId : null,
    layerIds,
  };
}

function sanitizeRemovedColors(raw: unknown): Record<string, number> | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  let out: Record<string, number> | undefined;
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value !== "number" || !Number.isFinite(value)) continue;
    out = out ?? {};
    out[key] = value;
  }
  return out;
}

function toNonNegativeInt(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return 0;
  return Math.round(value);
}

function toNonNegativeIntOrUndefined(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return undefined;
  return Math.round(value);
}

export function sanitizeReviewOptions(raw: unknown): SerializedProjectOptions {
  const data = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const formats = Array.isArray(data.exportFormats)
    ? data.exportFormats.filter((f): f is ExportFormat => typeof f === "string" && EXPORT_FORMATS.includes(f as ExportFormat))
    : [];
  return {
    exportFormats: formats.length > 0 ? Array.from(new Set(formats)) : (["svg"] as ExportFormat[]),
    autoResize2500: typeof data.autoResize2500 === "boolean" ? data.autoResize2500 : true,
    quickClean: typeof data.quickClean === "boolean" ? data.quickClean : true,
    removeWhiteBackground: typeof data.removeWhiteBackground === "boolean" ? data.removeWhiteBackground : true,
    backgroundMode: (["safe", "balanced", "aggressive"] as const).includes(data.backgroundMode as WhiteBackgroundMode)
      ? (data.backgroundMode as WhiteBackgroundMode)
      : "balanced",
    backgroundColorTolerance: clampNumber(data.backgroundColorTolerance, 0, 255, 28),
    firstPathScope: (["group-1", "first-group", "document"] as const).includes(data.firstPathScope as FirstPathScope)
      ? (data.firstPathScope as FirstPathScope)
      : "group-1",
    onlyDeleteIfWhiteLike: typeof data.onlyDeleteIfWhiteLike === "boolean" ? data.onlyDeleteIfWhiteLike : true,
    whiteTolerance: clampNumber(data.whiteTolerance, 0, 255, 28),
    cleanPngResidual: typeof data.cleanPngResidual === "boolean" ? data.cleanPngResidual : true,
    pngResidualTolerance: clampNumber(data.pngResidualTolerance, 0, 255, 24),
    skipSystemLayers: typeof data.skipSystemLayers === "boolean" ? data.skipSystemLayers : true,
    overwriteExisting: typeof data.overwriteExisting === "boolean" ? data.overwriteExisting : true,
    pngTransparent: typeof data.pngTransparent === "boolean" ? data.pngTransparent : true,
    jpgQuality: clampNumber(data.jpgQuality, 0.1, 1, 0.92),
    manualReview: typeof data.manualReview === "boolean" ? data.manualReview : true,
    reviewColorTolerance: clampNumber(data.reviewColorTolerance, 0, 255, 4),
    reviewCanvas: data.reviewCanvas === "checkerboard" || data.reviewCanvas === "white" ? data.reviewCanvas : "black",
  };
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

/** Suggested download name for the project file. */
export function buildProjectFileName(sourceName: string | null): string {
  const base = (sourceName || "review-project").trim().replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "") || "review-project";
  return `${base}.svg-editor-project.json`;
}
