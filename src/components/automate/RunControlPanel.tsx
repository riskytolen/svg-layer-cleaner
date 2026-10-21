"use client";

import { useBatchAutomationStore } from "@/store/batchAutomationStore";
import { Button } from "@/components/ui/button";
import {
  Play,
  Pause,
  X,
  Trash2,
  Loader2,
  ScanSearch,
  FlaskConical,
  Rocket,
  CheckCircle2,
  Circle,
  Gauge,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function RunControlPanel() {
  const options = useBatchAutomationStore((s) => s.options);
  const files = useBatchAutomationStore((s) => s.files);
  const totalFiles = useBatchAutomationStore((s) => s.totalFiles);
  const isScanning = useBatchAutomationStore((s) => s.isScanning);
  const isRunning = useBatchAutomationStore((s) => s.isRunning);
  const isPaused = useBatchAutomationStore((s) => s.isPaused);
  const currentFileIndex = useBatchAutomationStore((s) => s.currentFileIndex);
  const currentFileName = useBatchAutomationStore((s) => s.currentFileName);
  const scanInputFolder = useBatchAutomationStore((s) => s.scanInputFolder);
  const startDryRun = useBatchAutomationStore((s) => s.startDryRun);
  const startBatchProcess = useBatchAutomationStore((s) => s.startBatchProcess);
  const prepareBatchReview = useBatchAutomationStore((s) => s.prepareBatchReview);
  const isPreparingReview = useBatchAutomationStore((s) => s.isPreparingReview);
  const isReviewMode = useBatchAutomationStore((s) => s.isReviewMode);
  const pauseBatch = useBatchAutomationStore((s) => s.pauseBatch);
  const resumeBatch = useBatchAutomationStore((s) => s.resumeBatch);
  const cancelBatch = useBatchAutomationStore((s) => s.cancelBatch);
  const clearResults = useBatchAutomationStore((s) => s.clearResults);

  const hasInput = !!options.inputFolderHandle;
  const hasOutput = !!options.outputFolderHandle;
  const hasFormats = options.exportFormats.length > 0;
  const hasFiles = files.length > 0;
  const reviewMode = options.manualReview;
  // Review prepare needs no output folder yet — export happens after manual cleanup.
  const ready = reviewMode
    ? hasInput && hasFiles && !isRunning
    : hasInput && hasOutput && hasFormats && hasFiles && !isRunning;

  const percentage = totalFiles > 0 ? Math.round((currentFileIndex / totalFiles) * 100) : 0;

  const checklist = reviewMode
    ? [
        { label: "Input folder selected", done: hasInput },
        { label: `Files scanned (${files.length})`, done: hasFiles },
        { label: "Output folder (for final export)", done: hasOutput },
      ]
    : [
        { label: "Input folder selected", done: hasInput },
        { label: "Output folder selected", done: hasOutput },
        { label: "Export format selected", done: hasFormats },
        { label: `Files scanned (${files.length})`, done: hasFiles },
      ];

  return (
    <div className="rounded-lg border border-border bg-card p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.35)] h-full flex flex-col">
      <div className="flex items-center gap-2.5">
        <span className="w-8 h-8 rounded-md bg-elevated border border-border text-orange-400 flex items-center justify-center shrink-0">
          <Gauge className="w-4 h-4" strokeWidth={2} />
        </span>
        <span>
          <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Run Control</span>
          <span className="block text-[11px] text-muted-foreground">Execute the batch pipeline</span>
        </span>
        {isRunning && (
          <span className="ml-auto flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/25 text-[11px] font-semibold text-blue-400 tabular-nums">
            <Loader2 className="w-3 h-3 animate-spin" />
            {percentage}%
          </span>
        )}
      </div>

      {/* Readiness checklist */}
      <ul className="mt-3 space-y-1.5 rounded-md bg-background border border-border/70 p-2.5">
        {checklist.map((item) => (
          <li key={item.label} className="flex items-center gap-2 text-[11.5px]">
            {item.done ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ) : (
              <Circle className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
            )}
            <span className={item.done ? "font-medium text-foreground/90" : "text-muted-foreground"}>{item.label}</span>
          </li>
        ))}
      </ul>

      {/* Progress */}
      {isRunning && (
        <div className="mt-3">
          <div className="h-1.5 rounded-full bg-[#33333a] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="mt-1.5 text-[11px] text-muted-foreground truncate" title={currentFileName}>
            {isPreparingReview ? "Preparing review — " : ""}
            {currentFileIndex}/{totalFiles} — {currentFileName}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="mt-3 space-y-2">
        {!isRunning ? (
          reviewMode && !isReviewMode ? (
            <>
              <Button
                size="sm"
                onClick={prepareBatchReview}
                disabled={!ready}
                className="w-full h-9 rounded-md bg-violet-600 hover:bg-violet-500 text-white font-bold text-[13px] shadow-[0_1px_4px_rgba(124,58,237,0.35)]"
              >
                <ClipboardList className="w-4 h-4 mr-2" />
                Prepare Review
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={scanInputFolder}
                disabled={!hasInput || isScanning}
                className="w-full rounded-md font-semibold border-[#3f3f47] hover:bg-white/5"
              >
                {isScanning ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : (
                  <ScanSearch className="w-3.5 h-3.5 mr-1.5" />
                )}
                {isScanning ? "Scanning" : "Scan Folder"}
              </Button>
            </>
          ) : (
            <>
              <Button
                size="sm"
                onClick={startBatchProcess}
                disabled={!ready}
                className="w-full h-9 rounded-md bg-orange-600 hover:bg-orange-500 text-white font-bold text-[13px] shadow-[0_1px_4px_rgba(232,106,31,0.35)]"
              >
                <Rocket className="w-4 h-4 mr-2" />
                Start Processing
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startDryRun}
                  disabled={!ready}
                  className="rounded-md font-semibold border-[#3f3f47] hover:bg-white/5"
                >
                  <FlaskConical className="w-3.5 h-3.5 mr-1.5" />
                  Dry Run
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={scanInputFolder}
                  disabled={!hasInput || isScanning}
                  className="rounded-md font-semibold border-[#3f3f47] hover:bg-white/5"
                >
                  {isScanning ? (
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <ScanSearch className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  {isScanning ? "Scanning" : "Scan"}
                </Button>
              </div>
            </>
          )
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              {!isPaused ? (
                <Button variant="outline" size="sm" onClick={pauseBatch} className="rounded-md font-semibold border-[#3f3f47] hover:bg-white/5">
                  <Pause className="w-3.5 h-3.5 mr-1.5" />
                  Pause
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={resumeBatch} className="rounded-md font-semibold border-[#3f3f47] hover:bg-white/5">
                  <Play className="w-3.5 h-3.5 mr-1.5" />
                  Resume
                </Button>
              )}
              <Button variant="destructive" size="sm" onClick={cancelBatch} className="rounded-md font-semibold">
                <X className="w-3.5 h-3.5 mr-1.5" />
                Cancel
              </Button>
            </div>
          </>
        )}
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={clearResults}
        className={cn(
          "mt-auto w-full rounded-md text-muted-foreground hover:text-red-400 hover:bg-red-500/10 font-medium",
          isRunning ? "invisible" : "",
        )}
      >
        <Trash2 className="w-3.5 h-3.5 mr-1.5" />
        Clear results
      </Button>

      {!ready && !isRunning && (
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          Complete the checklist above to start.
        </p>
      )}
    </div>
  );
}
