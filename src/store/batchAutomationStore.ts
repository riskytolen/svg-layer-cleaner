"use client";

import { create } from "zustand";
import {
  BatchAutomationOptions,
  BatchFileResult,
  BatchSummary,
  BatchLogEntry,
  BatchReviewItem,
  BatchReviewStatus,
  ExportFormat,
  defaultBatchOptions,
} from "@/lib/batch/batchTypes";
import { scanSvgFolder, ScannedFile } from "@/lib/batch/scanSvgFolder";
import { processSingleSvgFile } from "@/lib/batch/processSingleSvgFile";
import { prepareSingleSvgForReview } from "@/lib/batch/prepareSingleSvgForReview";
import { exportDocToOutputFormats } from "@/lib/batch/exportReviewedSvgFile";
import { parseSvg } from "@/lib/svg/parseSvg";
import { serializeSvg } from "@/lib/svg/serializeSvg";
import { deleteElementsByLayerIds } from "@/lib/svg/deleteSvgElements";
import { findElementsByNearColor, getReviewLayerColors, NearColorMode } from "@/lib/svg/findElementsByNearColor";
import { adjustLayerSelection, subtractLayerSelection } from "@/lib/svg/layerSelection";
import { applyColorToLayers } from "@/lib/svg/reviewColor";
import { normalizeReviewColorInput } from "@/lib/svg/reviewColorCore";
import type { ReviewColorProperty } from "@/lib/svg/reviewColorCore";

export type ResultFilter = "all" | "success" | "failed" | "skipped" | "processing";

export type ReviewFilter = "all" | "pending" | "reviewed" | "skipped" | "ambiguous";

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

  // UI state
  resultFilter: ResultFilter;
  resultSearchQuery: string;
  rowsPerPage: number;
  currentPage: number;
  hideSuccessful: boolean;
  autoScrollToCurrent: boolean;
  isLogExpanded: boolean;
  expandedRowId: string | null;

  // Manual review mode state
  isReviewMode: boolean;
  isPreparingReview: boolean;
  isExportingReview: boolean;
  reviewItems: BatchReviewItem[];
  activeReviewId: string | null;
  reviewSelectedLayerId: string | null;
  reviewSelectedLayerIds: string[];
  reviewSelectionMode: "select" | "subtract" | "area-subtract";
  /** When true, canvas clicks sample the clicked object's color without changing the selection. */
  reviewPickColorMode: boolean;
  /** Which paint property manual recoloring edits/samples. */
  reviewColorProperty: ReviewColorProperty;
  /** Current edit color (any CSS color text; normalized on apply). */
  reviewEditColor: string | null;
  reviewSearchQuery: string;
  reviewFilter: ReviewFilter;
  reviewLastAction: string | null;

  // Actions
  selectInputFolder: (handle: any) => void;
  selectOutputFolder: (handle: any) => void;
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
  setResultFilter: (filter: ResultFilter) => void;
  setResultSearchQuery: (query: string) => void;
  setRowsPerPage: (value: number) => void;
  setCurrentPage: (page: number) => void;
  toggleHideSuccessful: (value?: boolean) => void;
  toggleAutoScrollToCurrent: (value?: boolean) => void;
  toggleLogExpanded: () => void;
  setExpandedRowId: (id: string | null) => void;

  // Manual review actions
  prepareBatchReview: () => Promise<void>;
  exitReviewMode: () => void;
  selectReviewItem: (id: string) => void;
  nextReviewItem: () => void;
  prevReviewItem: () => void;
  selectReviewLayer: (layerId: string) => void;
  toggleReviewLayer: (layerId: string) => void;
  deselectReviewLayer: (layerId: string) => void;
  setReviewSelectionMode: (mode: "select" | "subtract" | "area-subtract") => void;
  setReviewPickColorMode: (enabled: boolean) => void;
  setReviewColorProperty: (property: ReviewColorProperty) => void;
  setReviewEditColor: (color: string | null) => void;
  pickReviewColor: (layerId: string) => void;
  applyReviewColor: () => void;
  deselectReviewLayers: (layerIds: string[]) => void;
  clearReviewSelection: () => void;
  selectSameReviewColor: (mode: NearColorMode) => void;
  deleteReviewSelection: () => void;
  deleteReviewSameColor: (mode: NearColorMode) => void;
  undoReviewEdit: () => void;
  setReviewItemStatus: (id: string, status: BatchReviewStatus) => void;
  markActiveReviewed: () => void;
  markActiveSkipped: () => void;
  restoreActiveSkipped: () => void;
  setReviewSearchQuery: (query: string) => void;
  setReviewFilter: (filter: ReviewFilter) => void;
  exportReviewedBatch: () => Promise<void>;
};

const initialSummary: BatchSummary = {
  totalFiles: 0,
  processedFiles: 0,
  successFiles: 0,
  failedFiles: 0,
  skippedFiles: 0,
  totalDeletedPaths: 0,
  totalBgRemoved: 0,
  totalResidualPixels: 0,
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

  resultFilter: "all",
  resultSearchQuery: "",
  rowsPerPage: 50,
  currentPage: 1,
  hideSuccessful: false,
  autoScrollToCurrent: true,
  isLogExpanded: false,
  expandedRowId: null,

  isReviewMode: false,
  isPreparingReview: false,
  isExportingReview: false,
  reviewItems: [],
  activeReviewId: null,
  reviewSelectedLayerId: null,
  reviewSelectedLayerIds: [],
  reviewSelectionMode: "select",
  reviewPickColorMode: false,
  reviewColorProperty: "fill",
  reviewEditColor: null,
  reviewSearchQuery: "",
  reviewFilter: "all",
  reviewLastAction: null,

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
      isLogExpanded: false,
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
      isLogExpanded: false,
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
      resultFilter: "all",
      resultSearchQuery: "",
      currentPage: 1,
      expandedRowId: null,
      isReviewMode: false,
      isPreparingReview: false,
      isExportingReview: false,
      reviewItems: [],
      activeReviewId: null,
      reviewSelectedLayerId: null,
      reviewSelectedLayerIds: [],
      reviewSearchQuery: "",
      reviewSelectionMode: "select",
      reviewPickColorMode: false,
      reviewColorProperty: "fill",
      reviewEditColor: null,
      reviewFilter: "all",
      reviewLastAction: null,
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

    const runOptions = { ...options, dryRun };

    for (let i = 0; i < totalFiles; i++) {
      const current = get();
      if (current.isCancelled) break;

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

      summary.processedFiles++;
      if (result.status === "success") summary.successFiles++;
      else if (result.status === "failed") summary.failedFiles++;
      else if (result.status === "skipped") summary.skippedFiles++;
      summary.totalDeletedPaths += result.deletedCount;
      summary.totalBgRemoved = (summary.totalBgRemoved || 0) + (result.bgRemoved || result.deletedCount || 0);
      summary.totalResidualPixels =
        (summary.totalResidualPixels || 0) + (result.residualPixelsRemoved || 0) + (result.haloPixelsSoftened || 0);

      set((state) => ({
        results: [...state.results, result],
        summary: { ...summary },
      }));

      if (options.exportFormats.includes("eps") && !dryRun) {
        await new Promise((r) => setTimeout(r, 100));
      }
    }

    set({
      isRunning: false,
      isPaused: false,
      isCancelled: false,
      isLogExpanded: summary.failedFiles > 0,
    });

    get().addLog({
      level: "info",
      message: `Batch ${dryRun ? "dry run" : "processing"} complete. ${summary.successFiles} success, ${summary.failedFiles} failed, ${summary.skippedFiles} skipped.`,
    });
  },

  setResultFilter: (filter) => set({ resultFilter: filter, currentPage: 1 }),
  setResultSearchQuery: (query) => set({ resultSearchQuery: query, currentPage: 1 }),
  setRowsPerPage: (value) => set({ rowsPerPage: value, currentPage: 1 }),
  setCurrentPage: (page) => set({ currentPage: page }),
  toggleHideSuccessful: (value) => set((s) => ({ hideSuccessful: value ?? !s.hideSuccessful, currentPage: 1 })),
  toggleAutoScrollToCurrent: (value) => set((s) => ({ autoScrollToCurrent: value ?? !s.autoScrollToCurrent })),
  toggleLogExpanded: () => set((s) => ({ isLogExpanded: !s.isLogExpanded })),
  setExpandedRowId: (id) => set((s) => ({ expandedRowId: s.expandedRowId === id ? null : id })),

  // ---------- Manual review mode ----------

  prepareBatchReview: async () => {
    const state = get();
    if (state.files.length === 0) {
      get().addLog({ level: "error", message: "No files to review. Please scan the input folder first." });
      return;
    }

    set({
      isRunning: true,
      isPaused: false,
      isCancelled: false,
      isPreparingReview: true,
      isReviewMode: false,
      currentFileIndex: 0,
      reviewItems: [],
      activeReviewId: null,
      reviewSelectedLayerId: null,
      reviewSelectedLayerIds: [],
      reviewLastAction: null,
      reviewSelectionMode: "select",
      reviewPickColorMode: false,
      reviewColorProperty: "fill",
      reviewEditColor: null,
    });

    const { files, options } = get();
    const items: BatchReviewItem[] = [];
    let failed = 0;

    for (let i = 0; i < files.length; i++) {
      const current = get();
      if (current.isCancelled) break;

      while (current.isPaused && !current.isCancelled) {
        await new Promise((r) => setTimeout(r, 200));
        const s = get();
        if (s.isCancelled) break;
      }

      const file = files[i];
      set({ currentFileIndex: i + 1, currentFileName: file.file.name });

      try {
        const prepared = await prepareSingleSvgForReview(file.file, file.path, options, get().addLog);
        if (!prepared.ok || !prepared.doc || !prepared.svgText) {
          failed++;
          get().addLog({ level: "error", message: `${file.file.name}: prepare failed — ${prepared.error || "unknown error"}`, fileName: file.file.name });
          continue;
        }
        items.push({
          id: `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}`,
          fileName: file.file.name,
          inputPath: file.path,
          doc: prepared.doc,
          svgText: prepared.svgText,
          bgColor: prepared.bgColor,
          autoDeletedCount: prepared.autoDeletedCount,
          manualDeletedCount: 0,
          ambiguousCount: prepared.ambiguousCount,
          preservedNearWhite: prepared.preservedNearWhite,
          removedColors: prepared.removedColors,
          history: [],
          status: "pending-review",
          beforeSize: prepared.beforeSize,
        });
      } catch (err: unknown) {
        failed++;
        const msg = err instanceof Error ? err.message : String(err);
        get().addLog({ level: "error", message: `${file.file.name}: prepare failed — ${msg}`, fileName: file.file.name });
      }
    }

    const wasCancelled = get().isCancelled;
    set({
      isRunning: false,
      isPaused: false,
      isCancelled: false,
      isPreparingReview: false,
      isReviewMode: items.length > 0,
      reviewItems: items,
      activeReviewId: items.length > 0 ? items[0].id : null,
    });

    get().addLog({
      level: "success",
      message: `Review queue ready: ${items.length} assets${failed > 0 ? `, ${failed} failed` : ""}${wasCancelled ? " (cancelled)" : ""}. Select an asset and click residual colors to clean manually.`,
    });
  },

  exitReviewMode: () => {
    set({
      isReviewMode: false,
      reviewItems: [],
      activeReviewId: null,
      reviewSelectedLayerId: null,
      reviewSelectedLayerIds: [],
      reviewLastAction: null,
      reviewSelectionMode: "select",
      reviewPickColorMode: false,
      reviewColorProperty: "fill",
      reviewEditColor: null,
    });
  },

  selectReviewItem: (id) => {
    set({
      activeReviewId: id,
      reviewSelectedLayerId: null,
      reviewSelectedLayerIds: [],
      reviewLastAction: null,
      reviewSelectionMode: "select",
      reviewPickColorMode: false,
    });
  },

  nextReviewItem: () => {
    const { reviewItems, activeReviewId } = get();
    if (reviewItems.length === 0) return;
    const idx = reviewItems.findIndex((r) => r.id === activeReviewId);
    const next = reviewItems[(idx + 1 + reviewItems.length) % reviewItems.length];
    if (next) get().selectReviewItem(next.id);
  },

  prevReviewItem: () => {
    const { reviewItems, activeReviewId } = get();
    if (reviewItems.length === 0) return;
    const idx = reviewItems.findIndex((r) => r.id === activeReviewId);
    const prev = reviewItems[(idx - 1 + reviewItems.length) % reviewItems.length];
    if (prev) get().selectReviewItem(prev.id);
  },

  selectReviewLayer: (layerId) => {
    const { activeReviewId, reviewSelectedLayerId } = get();
    if (!activeReviewId) return;
    const next = reviewSelectedLayerId === layerId ? null : layerId;
    set({
      reviewSelectedLayerId: next,
      reviewSelectedLayerIds: next ? [next] : [],
    });
  },

  toggleReviewLayer: (layerId) => {
    const { activeReviewId, reviewSelectedLayerId, reviewSelectedLayerIds } = get();
    if (!activeReviewId) return;
    const selection = adjustLayerSelection({
      selectedLayerId: reviewSelectedLayerId,
      selectedLayerIds: reviewSelectedLayerIds,
    }, layerId);
    set({
      reviewSelectedLayerIds: selection.selectedLayerIds,
      reviewSelectedLayerId: selection.selectedLayerId,
      reviewLastAction: `${selection.selectedLayerIds.length} objects selected.`,
    });
  },

  deselectReviewLayer: (layerId) => {
    const { activeReviewId, reviewSelectedLayerId, reviewSelectedLayerIds } = get();
    if (!activeReviewId || !reviewSelectedLayerIds.includes(layerId)) return;
    const selection = adjustLayerSelection({
      selectedLayerId: reviewSelectedLayerId,
      selectedLayerIds: reviewSelectedLayerIds,
    }, layerId, "remove");
    set({
      reviewSelectedLayerIds: selection.selectedLayerIds,
      reviewSelectedLayerId: selection.selectedLayerId,
      reviewLastAction: `Object deselected. ${selection.selectedLayerIds.length} objects remain selected.`,
    });
  },

  deselectReviewLayers: (layerIds) => {
    const { activeReviewId, reviewSelectedLayerId, reviewSelectedLayerIds } = get();
    if (!activeReviewId || layerIds.length === 0) return;
    const next = subtractLayerSelection({
      selectedLayerId: reviewSelectedLayerId,
      selectedLayerIds: reviewSelectedLayerIds,
    }, layerIds);
    if (next.removed.length === 0) return;
    set({
      reviewSelectedLayerIds: next.selectedLayerIds,
      reviewSelectedLayerId: next.selectedLayerId,
      reviewLastAction: `${next.removed.length} object${next.removed.length > 1 ? "s" : ""} deselected by area. ${next.selectedLayerIds.length} remain selected.`,
    });
  },

  setReviewSelectionMode: (mode) => {
    set({
      reviewSelectionMode: mode,
      reviewPickColorMode: false,
      reviewLastAction: mode === "area-subtract"
        ? "Area deselect active. Drag a box over selected objects to release them; others stay selected."
        : mode === "subtract"
          ? "Click selected objects to deselect them. Other selections will be kept."
          : `${get().reviewSelectedLayerIds.length} objects remain selected.`,
    });
  },

  setReviewPickColorMode: (enabled) => {
    set({
      reviewPickColorMode: enabled,
      reviewSelectionMode: enabled ? "select" : get().reviewSelectionMode,
      reviewLastAction: enabled
        ? "Pipette active. Click an object on the canvas to copy its color; your selection is kept."
        : "Pipette stopped.",
    });
  },

  setReviewColorProperty: (property) => {
    set({
      reviewColorProperty: property,
      reviewLastAction: `Color edits now target ${property === "stroke" ? "stroke" : "fill"}.`,
    });
  },

  setReviewEditColor: (color) => {
    set({ reviewEditColor: color });
  },

  pickReviewColor: (layerId) => {
    const { reviewItems, activeReviewId, reviewColorProperty } = get();
    const item = reviewItems.find((r) => r.id === activeReviewId);
    if (!item) return;
    const propertyLabel = reviewColorProperty === "stroke" ? "stroke" : "fill";
    let color: string | null = null;
    try {
      const colors = getReviewLayerColors(item.doc, layerId);
      color = reviewColorProperty === "stroke" ? colors.stroke : colors.fill;
    } catch {
      color = null;
    }
    if (!color) {
      set({
        reviewLastAction: `Picked object has no ${propertyLabel} color. Try another object or switch the property.`,
      });
      return;
    }
    const count = get().reviewSelectedLayerIds.length;
    set({
      reviewEditColor: color,
      reviewLastAction: `${propertyLabel} color ${color} copied.${
        count > 0
          ? ` Click Apply color to change ${count} selected object${count > 1 ? "s" : ""}.`
          : " Select objects, then Apply color."
      }`,
    });
  },

  applyReviewColor: () => {
    const { reviewItems, activeReviewId, reviewSelectedLayerIds, reviewEditColor, reviewColorProperty } = get();
    const item = reviewItems.find((r) => r.id === activeReviewId);
    if (!item || reviewSelectedLayerIds.length === 0) {
      set({ reviewLastAction: "Select the objects whose color you want to change." });
      return;
    }
    const hex = normalizeReviewColorInput(reviewEditColor);
    if (!hex) {
      set({ reviewLastAction: "Pick a color on the canvas or enter a valid hex value first." });
      return;
    }
    const before = serializeSvg(item.doc);
    const res = applyColorToLayers(item.doc, reviewSelectedLayerIds, reviewColorProperty, hex);
    if (res.changed === 0) {
      set({ reviewLastAction: "Nothing changed. Selected objects may be protected and cannot be colored." });
      return;
    }
    const svgText = serializeSvg(item.doc);
    const skippedNote = res.skipped > 0 ? ` ${res.skipped} protected object${res.skipped > 1 ? "s" : ""} skipped.` : "";
    set((state) => ({
      reviewItems: state.reviewItems.map((r) =>
        r.id === item.id
          ? {
              ...r,
              svgText,
              history: [...r.history.slice(-49), before],
            }
          : r,
      ),
      reviewEditColor: hex,
      reviewLastAction: `${res.changed} object${res.changed > 1 ? "s" : ""} ${reviewColorProperty} changed to ${hex}.${skippedNote}`,
    }));
    get().addLog({
      level: "color",
      message: `${item.fileName}: [MANUAL] ${res.changed} objects ${reviewColorProperty} changed to ${hex}.`,
      fileName: item.fileName,
    });
  },

  clearReviewSelection: () => {
    set({
      reviewSelectedLayerId: null,
      reviewSelectedLayerIds: [],
      reviewSelectionMode: "select",
      reviewLastAction: "Selection cleared.",
    });
  },

  selectSameReviewColor: (mode) => {
    const { reviewItems, activeReviewId, reviewSelectedLayerId, options } = get();
    const item = reviewItems.find((r) => r.id === activeReviewId);
    if (!item || !reviewSelectedLayerId) {
      set({ reviewLastAction: "Select an object on the canvas first." });
      return;
    }
    const ids = findElementsByNearColor(item.doc, reviewSelectedLayerId, {
      mode,
      tolerance: options.reviewColorTolerance,
    });
    if (ids.length === 0) {
      set({ reviewLastAction: "No matching objects found for this color." });
      return;
    }
    const colors = getReviewLayerColors(item.doc, reviewSelectedLayerId);
    const colorLabel = mode === "stroke" ? colors.stroke : colors.fill;
    set({
      reviewSelectedLayerIds: ids,
      reviewSelectedLayerId: ids.includes(reviewSelectedLayerId) ? reviewSelectedLayerId : ids[0],
      reviewSelectionMode: "select",
      reviewLastAction: `${ids.length} objects with ${mode} ${colorLabel || ""} selected.`,
    });
  },

  deleteReviewSelection: () => {
    const { reviewItems, activeReviewId, reviewSelectedLayerIds } = get();
    const item = reviewItems.find((r) => r.id === activeReviewId);
    if (!item || reviewSelectedLayerIds.length === 0) {
      set({ reviewLastAction: "Nothing selected to delete." });
      return;
    }
    const before = serializeSvg(item.doc);
    const res = deleteElementsByLayerIds(item.doc, reviewSelectedLayerIds);
    if (res.deletedCount === 0) {
      set({ reviewLastAction: "Selected objects are protected and cannot be deleted." });
      return;
    }
    const svgText = serializeSvg(item.doc);
    set((state) => ({
      reviewItems: state.reviewItems.map((r) =>
        r.id === item.id
          ? {
              ...r,
              svgText,
              history: [...r.history.slice(-49), before],
              manualDeletedCount: r.manualDeletedCount + res.deletedCount,
            }
          : r,
      ),
      reviewSelectedLayerId: null,
      reviewSelectedLayerIds: [],
      reviewLastAction: `${res.deletedCount} object${res.deletedCount > 1 ? "s" : ""} deleted manually.`,
      reviewSelectionMode: "select",
    }));
    get().addLog({ level: "delete", message: `${item.fileName}: [MANUAL] ${res.deletedCount} objects deleted.`, fileName: item.fileName });
  },

  deleteReviewSameColor: (mode) => {
    const { reviewItems, activeReviewId, reviewSelectedLayerId, options } = get();
    const item = reviewItems.find((r) => r.id === activeReviewId);
    if (!item || !reviewSelectedLayerId) {
      set({ reviewLastAction: "Click a residual color on the canvas first." });
      return;
    }
    const ids = findElementsByNearColor(item.doc, reviewSelectedLayerId, {
      mode,
      tolerance: options.reviewColorTolerance,
    });
    if (ids.length === 0) {
      set({ reviewLastAction: "No matching objects found for this color." });
      return;
    }
    const before = serializeSvg(item.doc);
    const res = deleteElementsByLayerIds(item.doc, ids);
    const svgText = serializeSvg(item.doc);
    set((state) => ({
      reviewItems: state.reviewItems.map((r) =>
        r.id === item.id
          ? {
              ...r,
              svgText,
              history: [...r.history.slice(-49), before],
              manualDeletedCount: r.manualDeletedCount + res.deletedCount,
            }
          : r,
      ),
      reviewSelectedLayerId: null,
      reviewSelectedLayerIds: [],
      reviewLastAction: `${res.deletedCount} objects with same ${mode} deleted (tolerance ${options.reviewColorTolerance}).`,
      reviewSelectionMode: "select",
    }));
    get().addLog({ level: "delete", message: `${item.fileName}: [MANUAL] ${res.deletedCount} same-${mode} objects deleted.`, fileName: item.fileName });
  },

  undoReviewEdit: () => {
    const { reviewItems, activeReviewId } = get();
    const item = reviewItems.find((r) => r.id === activeReviewId);
    if (!item || item.history.length === 0) {
      set({ reviewLastAction: "Nothing to undo." });
      return;
    }
    const prev = item.history[item.history.length - 1];
    const restored = parseSvg(prev);
    set((state) => ({
      reviewItems: state.reviewItems.map((r) =>
        r.id === item.id
          ? { ...r, doc: restored, svgText: prev, history: r.history.slice(0, -1) }
          : r,
      ),
      reviewSelectedLayerId: null,
      reviewSelectedLayerIds: [],
      reviewLastAction: "Manual edit undone.",
      reviewSelectionMode: "select",
    }));
  },

  setReviewItemStatus: (id, status) => {
    set((state) => ({
      reviewItems: state.reviewItems.map((r) => (r.id === id ? { ...r, status } : r)),
    }));
  },

  markActiveReviewed: () => {
    const { activeReviewId } = get();
    if (!activeReviewId) return;
    get().setReviewItemStatus(activeReviewId, "reviewed");
    set({ reviewLastAction: "Marked as reviewed." });
    get().nextReviewItem();
  },

  markActiveSkipped: () => {
    const { activeReviewId } = get();
    if (!activeReviewId) return;
    get().setReviewItemStatus(activeReviewId, "skipped");
    set({ reviewLastAction: "Rejected — this asset will not be exported." });
    get().nextReviewItem();
  },

  restoreActiveSkipped: () => {
    const { activeReviewId } = get();
    if (!activeReviewId) return;
    get().setReviewItemStatus(activeReviewId, "pending-review");
    set({ reviewLastAction: "Asset restored to the review queue." });
  },

  setReviewSearchQuery: (query) => set({ reviewSearchQuery: query }),
  setReviewFilter: (filter) => set({ reviewFilter: filter }),

  exportReviewedBatch: async () => {
    const state = get();
    if (!state.options.outputFolderHandle) {
      get().addLog({ level: "error", message: "Please select an output folder first." });
      return;
    }
    const exportable = state.reviewItems.filter((r) => r.status !== "skipped");
    if (exportable.length === 0) {
      get().addLog({ level: "error", message: "Nothing to export — all review items are skipped." });
      return;
    }
    const pending = exportable.filter((r) => r.status === "pending-review").length;

    set({
      isRunning: true,
      isPaused: false,
      isCancelled: false,
      isExportingReview: true,
      currentFileIndex: 0,
      results: [],
      summary: { ...initialSummary, totalFiles: exportable.length },
      isLogExpanded: false,
    });

    if (pending > 0) {
      get().addLog({ level: "warning", message: `${pending} asset${pending > 1 ? "s" : ""} not marked reviewed — exporting anyway.` });
    }

    const { options } = get();
    let summary: BatchSummary = { ...initialSummary, totalFiles: exportable.length };

    for (let i = 0; i < exportable.length; i++) {
      const current = get();
      if (current.isCancelled) break;

      while (current.isPaused && !current.isCancelled) {
        await new Promise((r) => setTimeout(r, 200));
        const s = get();
        if (s.isCancelled) break;
      }

      const item = exportable[i];
      set({ currentFileIndex: i + 1, currentFileName: item.fileName });

      const baseName = item.fileName.replace(/\.svg$/i, "");
      const startedAt = Date.now();
      try {
        const exported = await exportDocToOutputFormats(
          item.doc,
          baseName,
          options.outputFolderHandle!,
          { ...options, dryRun: false },
          get().addLog,
          item.bgColor,
          item.fileName,
        );
        summary.processedFiles++;
        summary.successFiles++;
        const deleted = item.autoDeletedCount + item.manualDeletedCount;
        summary.totalDeletedPaths += deleted;
        summary.totalBgRemoved = (summary.totalBgRemoved || 0) + deleted;
        summary.totalResidualPixels =
          (summary.totalResidualPixels || 0) + exported.residualPixelsRemoved + exported.haloPixelsSoftened;
        set((s) => ({
          results: [
            ...s.results,
            {
              id: `${Date.now()}-${i}`,
              fileName: item.fileName,
              inputPath: item.inputPath,
              outputNames: exported.outputNames,
              status: "success" as const,
              normalizedFill: item.bgColor,
              bgColor: item.bgColor,
              matchedCount: item.autoDeletedCount,
              deletedCount: deleted,
              bgRemoved: item.autoDeletedCount,
              ambiguousCount: item.ambiguousCount,
              preservedNearWhite: item.preservedNearWhite,
              removedColors: item.removedColors,
              residualPixelsRemoved: exported.residualPixelsRemoved,
              haloPixelsSoftened: exported.haloPixelsSoftened,
              exportedFormats: exported.exportedFormats,
              warning: item.status === "pending-review" ? "Exported without manual review." : null,
              beforeSize: item.beforeSize,
              afterSize: item.svgText.length,
              startedAt,
              finishedAt: Date.now(),
            },
          ],
          summary: { ...summary },
        }));
        get().addLog({ level: "success", message: `${item.fileName} exported (auto ${item.autoDeletedCount} + manual ${item.manualDeletedCount}).`, fileName: item.fileName });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        summary.processedFiles++;
        summary.failedFiles++;
        set((s) => ({
          results: [
            ...s.results,
            {
              id: `${Date.now()}-${i}`,
              fileName: item.fileName,
              inputPath: item.inputPath,
              outputNames: [],
              status: "failed" as const,
              matchedCount: 0,
              deletedCount: 0,
              exportedFormats: [],
              error: msg,
              startedAt,
              finishedAt: Date.now(),
            },
          ],
          summary: { ...summary },
        }));
        get().addLog({ level: "error", message: `${item.fileName} export failed: ${msg}`, fileName: item.fileName });
      }

      if (options.exportFormats.includes("eps")) {
        await new Promise((r) => setTimeout(r, 100));
      }
    }

    set({
      isRunning: false,
      isPaused: false,
      isCancelled: false,
      isExportingReview: false,
      isLogExpanded: summary.failedFiles > 0,
    });

    get().addLog({
      level: "info",
      message: `Reviewed batch export complete. ${summary.successFiles} success, ${summary.failedFiles} failed.`,
    });
  },
}));
