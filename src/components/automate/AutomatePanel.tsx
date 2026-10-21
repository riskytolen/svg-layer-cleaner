"use client";

import { FolderPicker } from "./FolderPicker";
import { ExportFormatSelector } from "./ExportFormatSelector";
import { BatchOptionsPanel } from "./BatchOptionsPanel";
import { BatchProgressTable } from "./BatchProgressTable";
import { BatchSummary } from "./BatchSummary";
import { BatchLogPanel } from "./BatchLogPanel";
import { RunControlPanel } from "./RunControlPanel";
import { BatchReviewWorkspace } from "./BatchReviewWorkspace";
import { useReviewAutosave } from "./useReviewAutosave";
import { useBatchAutomationStore } from "@/store/batchAutomationStore";
import { Loader2, WandSparkles, History, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export function AutomatePanel() {
  useReviewAutosave();
  const isRunning = useBatchAutomationStore((s) => s.isRunning);
  const isPaused = useBatchAutomationStore((s) => s.isPaused);
  const isScanning = useBatchAutomationStore((s) => s.isScanning);
  const isReviewMode = useBatchAutomationStore((s) => s.isReviewMode);
  const isPreparingReview = useBatchAutomationStore((s) => s.isPreparingReview);
  const totalFiles = useBatchAutomationStore((s) => s.totalFiles);
  const currentFileIndex = useBatchAutomationStore((s) => s.currentFileIndex);
  const currentFileName = useBatchAutomationStore((s) => s.currentFileName);

  const status = isRunning
    ? isPreparingReview
      ? "preparing"
      : isPaused
        ? "paused"
        : "running"
    : isScanning
      ? "scanning"
      : isReviewMode
        ? "review"
        : totalFiles > 0
          ? "ready"
          : "idle";

  const statusMeta: Record<string, { label: string; dot: string; pill: string }> = {
    idle: { label: "Idle", dot: "bg-zinc-500", pill: "bg-zinc-500/10 text-zinc-400 border-zinc-500/25" },
    ready: { label: `${totalFiles} files ready`, dot: "bg-emerald-500", pill: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25" },
    scanning: { label: "Scanning folders", dot: "bg-blue-500 animate-pulse", pill: "bg-blue-500/10 text-blue-400 border-blue-500/25" },
    preparing: { label: "Preparing review", dot: "bg-violet-500 animate-pulse", pill: "bg-violet-500/10 text-violet-400 border-violet-500/25" },
    review: { label: "Manual review", dot: "bg-violet-500", pill: "bg-violet-500/10 text-violet-400 border-violet-500/25" },
    running: { label: "Processing batch", dot: "bg-orange-500 animate-pulse", pill: "bg-orange-500/10 text-orange-400 border-orange-500/25" },
    paused: { label: "Paused", dot: "bg-amber-500", pill: "bg-amber-500/10 text-amber-400 border-amber-500/25" },
  };
  const meta = statusMeta[status];

  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto max-w-[1400px] px-5 py-5 space-y-4">
        {/* Work header */}
        <header className="flex flex-wrap items-center gap-3 px-1">
          <span className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center shrink-0 shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
            <WandSparkles className="w-4.5 h-4.5 text-white" strokeWidth={2.25} />
          </span>
          <div className="min-w-0">
            <h1 className="text-[15px] font-bold tracking-tight leading-tight">Batch Background Cleaner</h1>
            <p className="text-[11.5px] text-muted-foreground leading-tight">
              Remove white backgrounds across whole folders and export clean transparent assets.
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {(isRunning || isScanning) && (
              <span className="hidden md:flex items-center gap-2 text-[11px] text-muted-foreground">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="truncate max-w-[280px]">
                  {isRunning
                    ? `${currentFileIndex}/${totalFiles} — ${currentFileName}`
                    : "Scanning input folder for SVG files…"}
                </span>
              </span>
            )}
            <span className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-semibold", meta.pill)}>
              <span className={cn("w-1.5 h-1.5 rounded-full", meta.dot)} />
              {meta.label}
            </span>
          </div>
        </header>

        {/* Folder setup */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FolderPicker type="input" />
          <FolderPicker type="output" />
        </section>

        {/* Workspace */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
          <div className="lg:col-span-3">
            <ExportFormatSelector />
          </div>
          <div className="lg:col-span-6">
            <BatchOptionsPanel />
          </div>
          <div className="lg:col-span-3">
            <RunControlPanel />
          </div>
        </section>

        {/* Resume autosaved review, when the workspace is not open */}
        <AutosaveResumeBanner />

        {/* Manual review workspace (after auto clean, before final export) */}
        <BatchReviewWorkspace />

        {/* Summary */}
        <BatchSummary />

        {/* Result table */}
        <BatchProgressTable />

        {/* Log */}
        <BatchLogPanel />
      </div>
    </div>
  );
}

function AutosaveResumeBanner() {
  const hasAutosaveDraft = useBatchAutomationStore((s) => s.hasAutosaveDraft);
  const autosaveDraftMeta = useBatchAutomationStore((s) => s.autosaveDraftMeta);
  const isReviewMode = useBatchAutomationStore((s) => s.isReviewMode);
  const isRunning = useBatchAutomationStore((s) => s.isRunning);
  const isScanning = useBatchAutomationStore((s) => s.isScanning);
  const isPreparingReview = useBatchAutomationStore((s) => s.isPreparingReview);
  const isRestoringProject = useBatchAutomationStore((s) => s.isRestoringProject);
  const continueAutosavedProject = useBatchAutomationStore((s) => s.continueAutosavedProject);
  const discardAutosave = useBatchAutomationStore((s) => s.discardAutosave);

  if (!hasAutosaveDraft || isReviewMode) return null;
  const busy = isRunning || isPreparingReview || isScanning || isRestoringProject;

  return (
    <section className="rounded-2xl border-2 border-violet-200 bg-gradient-to-r from-violet-50/80 to-transparent p-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="w-10 h-10 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center shrink-0 border border-violet-200">
          <History className="w-5 h-5" strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-bold tracking-tight">Continue previous review?</h3>
          <p className="text-xs text-muted-foreground tabular-nums">
            {autosaveDraftMeta
              ? `${autosaveDraftMeta.itemCount} asset${autosaveDraftMeta.itemCount > 1 ? "s" : ""} · autosaved ${new Date(autosaveDraftMeta.savedAt).toLocaleString()}${autosaveDraftMeta.sourceName ? ` · ${autosaveDraftMeta.sourceName}` : ""}`
              : "An autosaved review session is waiting in this browser."}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={discardAutosave}
            disabled={busy}
            className="rounded-xl px-2.5"
            title="Delete the autosave draft without opening it"
            aria-label="Delete autosave draft"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
          </Button>
          <Button
            size="sm"
            onClick={continueAutosavedProject}
            disabled={busy}
            className="rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold shadow-[0_2px_8px_rgba(124,58,237,0.35)]"
          >
            {isRestoringProject ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <History className="w-3.5 h-3.5 mr-1.5" />
            )}
            Continue review
          </Button>
        </div>
      </div>
    </section>
  );
}
