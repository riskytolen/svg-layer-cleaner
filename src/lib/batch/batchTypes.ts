export type ExportFormat = "svg" | "png" | "jpg" | "eps";

export type FirstPathScope = "group-1" | "first-group" | "document";

export type WhiteBackgroundMode = "safe" | "balanced" | "aggressive";

export type BatchAutomationOptions = {
  inputFolderHandle: FileSystemDirectoryHandle | null;
  outputFolderHandle: FileSystemDirectoryHandle | null;

  exportFormats: ExportFormat[];

  recursive: boolean;
  autoResize2500: boolean;
  quickClean: boolean;

  /** @deprecated Use removeWhiteBackground instead. Kept for back-compat. */
  removeSameFillAsFirstPath: boolean;
  /** New context-aware white background remover. */
  removeWhiteBackground: boolean;
  backgroundMode: WhiteBackgroundMode;
  /** RGB distance tolerance for residual candidates near the main background. */
  backgroundColorTolerance: number;
  firstPathScope: FirstPathScope;
  onlyDeleteIfWhiteLike: boolean;
  whiteTolerance: number;

  /** Raster cleanup for transparent PNG output (edge-connected flood fill + anti-halo). */
  cleanPngResidual: boolean;
  pngResidualTolerance: number;

  skipSystemLayers: boolean;
  dryRun: boolean;
  overwriteExisting: boolean;

  pngTransparent: boolean;
  jpgQuality: number;

  /** Manual review after auto clean: prepare items for per-asset review instead of direct export. */
  manualReview: boolean;
  /** RGB tolerance for manual "delete same color" in review (0 = exact). */
  reviewColorTolerance: number;
  /** Preview canvas behind the transparent SVG during review. */
  reviewCanvas: "black" | "checkerboard" | "white";
};

export type BatchReviewStatus = "pending-review" | "reviewed" | "skipped";

export type BatchReviewItem = {
  id: string;
  fileName: string;
  inputPath?: string;
  /** Live editable DOM of the auto-cleaned + normalized SVG. */
  doc: Document;
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

export type BatchFileStatus =
  | "pending"
  | "processing"
  | "success"
  | "failed"
  | "skipped";

export type BatchFileResult = {
  id: string;
  fileName: string;
  inputPath?: string;
  outputNames: string[];

  status: BatchFileStatus;

  path1LayerId?: string | null;
  path1Fill?: string | null;
  normalizedFill?: string | null;

  matchedCount: number;
  deletedCount: number;

  /** New background-removal report fields. */
  bgRemoved?: number;
  bgColor?: string | null;
  ambiguousCount?: number;
  preservedNearWhite?: number;
  removedColors?: Record<string, number>;
  residualPixelsRemoved?: number;
  haloPixelsSoftened?: number;

  exportedFormats: ExportFormat[];

  error?: string | null;
  warning?: string | null;

  beforeSize?: number;
  afterSize?: number;

  startedAt?: number;
  finishedAt?: number;
};

export type BatchSummary = {
  totalFiles: number;
  processedFiles: number;
  successFiles: number;
  failedFiles: number;
  skippedFiles: number;
  totalDeletedPaths: number;
  totalBgRemoved?: number;
  totalResidualPixels?: number;
};

export type BatchLogEntry = {
  timestamp: number;
  level: "info" | "process" | "color" | "delete" | "export" | "success" | "warning" | "error";
  message: string;
  fileName?: string;
};

export const defaultBatchOptions: BatchAutomationOptions = {
  inputFolderHandle: null,
  outputFolderHandle: null,
  exportFormats: ["svg"],
  recursive: false,
  autoResize2500: true,
  quickClean: true,
  removeSameFillAsFirstPath: true,
  removeWhiteBackground: true,
  backgroundMode: "balanced",
  backgroundColorTolerance: 28,
  firstPathScope: "group-1",
  onlyDeleteIfWhiteLike: true,
  whiteTolerance: 28,
  cleanPngResidual: true,
  pngResidualTolerance: 24,
  skipSystemLayers: true,
  dryRun: true,
  overwriteExisting: true,
  pngTransparent: true,
  jpgQuality: 0.92,
  manualReview: false,
  reviewColorTolerance: 4,
  reviewCanvas: "black",
};
