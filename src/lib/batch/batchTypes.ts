export type ExportFormat = "svg" | "png" | "jpg" | "eps";

export type FirstPathScope = "group-1" | "first-group" | "document";

export type BatchAutomationOptions = {
  inputFolderHandle: FileSystemDirectoryHandle | null;
  outputFolderHandle: FileSystemDirectoryHandle | null;

  exportFormats: ExportFormat[];

  recursive: boolean;
  autoResize2500: boolean;
  quickClean: boolean;

  removeSameFillAsFirstPath: boolean;
  firstPathScope: FirstPathScope;
  onlyDeleteIfWhiteLike: boolean;
  whiteTolerance: number;

  skipSystemLayers: boolean;
  dryRun: boolean;
  overwriteExisting: boolean;

  pngTransparent: boolean;
  jpgQuality: number;
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
  firstPathScope: "group-1",
  onlyDeleteIfWhiteLike: false,
  whiteTolerance: 10,
  skipSystemLayers: true,
  dryRun: true,
  overwriteExisting: true,
  pngTransparent: true,
  jpgQuality: 0.92,
};
