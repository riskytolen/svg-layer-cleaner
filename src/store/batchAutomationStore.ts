"use client";

import { create } from "zustand";
import {
  BatchAutomationOptions,
  BatchFileResult,
  BatchSummary,
  BatchLogEntry,
  ExportFormat,
  defaultBatchOptions,
} from "@/lib/batch/batchTypes";
import { scanSvgFolder, ScannedFile } from "@/lib/batch/scanSvgFolder";
import { processSingleSvgFile } from "@/lib/batch/processSingleSvgFile";

type BatchAutomationStore = {
  options: BatchAutomationOptions;
  files: ScannedFile[];
  results: BatchFileResult[];
  summary: BatchSummary;
  logs: BatchLogEntry[];

  isScanning: boolean;
  isRunning: boolean;
  isPaused: boolean;
  isCancelled: boolean;

  currentFileIndex: number;
  currentFileName: string;
  totalFiles: number;

  // Actions
  selectInputFolder: (handle: FileSystemDirectoryHandle) => void;
  selectOutputFolder: (handle: FileSystemDirectoryHandle) => void;
  scanInputFolder: () => Promise<void>;
  setExportFormats: (formats: ExportFormat[]) => void;
  updateOptions: (partial: Partial<BatchAutomationOptions>) => void;
  startDryRun: () => Promise<void>;
  startBatchProcess: () => Promise<void>;
  pauseBatch: () => void;
  resumeBatch: () => void;
  cancelBatch: () => void;
  clearResults: () => void;
  addLog: (entry: Omit<BatchLogEntry, "timestamp">) => void;
  runBatch: (dryRun: boolean) => Promise<void>;
};

const initialSummary: BatchSummary = {
  totalFiles: 0,
  processedFiles: 0,
  successFiles: 0,
  failedFiles: 0,
  skippedFiles: 0,
  totalDeletedPaths: 0,
};

export const useBatchAutomationStore = create<BatchAutomationStore>((set, get) => ({
  options: { ...defaultBatchOptions },
  files: [],
  results: [],
  summary: { ...initialSummary },
  logs: [],

  isScanning: false,
  isRunning: false,
  isPaused: false,
  isCancelled: false,

  currentFileIndex: 0,
  currentFileName: "",
  totalFiles: 0,

  selectInputFolder: (handle) => {
    set((state) => ({
      options: { ...state.options, inputFolderHandle: handle },
    }));
  },

  selectOutputFolder: (handle) => {
    set((state) => ({
      options: { ...state.options, outputFolderHandle: handle },
    }));
  },

  scanInputFolder: async () => {
    const state = get();
    if (!state.options.inputFolderHandle) return;

    set({ isScanning: true });

    try {
      const files = await scanSvgFolder(state.options.inputFolderHandle, {
        recursive: state.options.recursive,
      });

      set({
        files,
        totalFiles: files.length,
        summary: { ...initialSummary, totalFiles: files.length },
      });

      get().addLog({
        level: "info",
        message: `Found ${files.length} SVG files.`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      get().addLog({ level: "error", message: `Scan failed: ${msg}` });
    } finally {
      set({ isScanning: false });
    }
  },

  setExportFormats: (formats) => {
    set((state) => ({
      options: { ...state.options, exportFormats: formats },
    }));
  },

  updateOptions: (partial) => {
    set((state) => ({
      options: { ...state.options, ...partial },
    }));
  },

  startDryRun: async () => {
    const state = get();
    if (!state.options.outputFolderHandle) {
      get().addLog({ level: "error", message: "Please select an output folder first." });
      return;
    }
    if (state.files.length === 0) {
      get().addLog({ level: "error", message: "No files to process. Please scan the input folder first." });
      return;
    }

    set({
      isRunning: true,
      isPaused: false,
      isCancelled: false,
      currentFileIndex: 0,
      results: [],
      summary: { ...initialSummary, totalFiles: state.files.length },
    });

    await get().runBatch(true);
  },

  startBatchProcess: async () => {
    const state = get();
    if (!state.options.outputFolderHandle) {
      get().addLog({ level: "error", message: "Please select an output folder first." });
      return;
    }
    if (state.files.length === 0) {
      get().addLog({ level: "error", message: "No files to process. Please scan the input folder first." });
      return;
    }

    set({
      isRunning: true,
      isPaused: false,
      isCancelled: false,
      currentFileIndex: 0,
      results: [],
      summary: { ...initialSummary, totalFiles: state.files.length },
    });

    await get().runBatch(false);
  },

  pauseBatch: () => {
    set({ isPaused: true });
    get().addLog({ level: "info", message: "Batch paused." });
  },

  resumeBatch: () => {
    set({ isPaused: false });
    get().addLog({ level: "info", message: "Batch resumed." });
  },

  cancelBatch: () => {
    set({ isCancelled: true, isPaused: false });
    get().addLog({ level: "info", message: "Batch cancelled." });
  },

  clearResults: () => {
    set({
      results: [],
      summary: { ...initialSummary },
      logs: [],
      currentFileIndex: 0,
      currentFileName: "",
    });
  },

  addLog: (entry) => {
    set((state) => ({
      logs: [...state.logs, { ...entry, timestamp: Date.now() }],
    }));
  },

  runBatch: async (dryRun: boolean) => {
    const state = get();
    const { files, options } = state;
    const totalFiles = files.length;
    let summary: BatchSummary = { ...initialSummary, totalFiles };

    // Update options with dry run
    const runOptions = { ...options, dryRun };

    for (let i = 0; i < totalFiles; i++) {
      // Check cancel
      const current = get();
      if (current.isCancelled) break;

      // Check pause
      while (current.isPaused && !current.isCancelled) {
        await new Promise((r) => setTimeout(r, 200));
        const s = get();
        if (s.isCancelled) break;
      }

      const file = files[i];
      set({ currentFileIndex: i + 1, currentFileName: file.file.name });

      const result = await processSingleSvgFile(
        file.file,
        file.path,
        runOptions,
        get().addLog,
      );

      // Update summary
      summary.processedFiles++;
      if (result.status === "success") summary.successFiles++;
      else if (result.status === "failed") summary.failedFiles++;
      else if (result.status === "skipped") summary.skippedFiles++;
      summary.totalDeletedPaths += result.deletedCount;

      set((state) => ({
        results: [...state.results, result],
        summary: { ...summary },
      }));

      // Small delay for EPS to not overload server
      if (options.exportFormats.includes("eps") && !dryRun) {
        await new Promise((r) => setTimeout(r, 100));
      }
    }

    set({
      isRunning: false,
      isPaused: false,
      isCancelled: false,
    });

    get().addLog({
      level: "info",
      message: `Batch ${dryRun ? "dry run" : "processing"} complete. ${summary.successFiles} success, ${summary.failedFiles} failed, ${summary.skippedFiles} skipped.`,
    });
  },
}));
