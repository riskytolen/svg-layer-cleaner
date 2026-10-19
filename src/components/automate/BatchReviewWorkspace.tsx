"use client";

import { useBatchAutomationStore } from "@/store/batchAutomationStore";
import { BatchReviewQueue } from "./BatchReviewQueue";
import { BatchReviewPreview } from "./BatchReviewPreview";
import { BatchReviewTools } from "./BatchReviewTools";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, PackageCheck, LogOut, Loader2 } from "lucide-react";

export function BatchReviewWorkspace() {
  const reviewItems = useBatchAutomationStore((s) => s.reviewItems);
  const isReviewMode = useBatchAutomationStore((s) => s.isReviewMode);
  const isExportingReview = useBatchAutomationStore((s) => s.isExportingReview);
  const isRunning = useBatchAutomationStore((s) => s.isRunning);
  const hasOutput = useBatchAutomationStore((s) => !!s.options.outputFolderHandle);
  const exportReviewedBatch = useBatchAutomationStore((s) => s.exportReviewedBatch);
  const exitReviewMode = useBatchAutomationStore((s) => s.exitReviewMode);

  if (!isReviewMode) return null;

  const reviewedCount = reviewItems.filter((r) => r.status === "reviewed").length;
  const skippedCount = reviewItems.filter((r) => r.status === "skipped").length;
  const exportableCount = reviewItems.length - skippedCount;
  const percentage = reviewItems.length > 0 ? Math.round((reviewedCount / reviewItems.length) * 100) : 0;

  return (
    <section className="rounded-2xl border-2 border-violet-200 bg-gradient-to-b from-violet-50/60 to-transparent p-5 space-y-4">
      {/* Workspace header */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center shrink-0 shadow-[0_2px_8px_rgba(124,58,237,0.35)]">
          <ClipboardCheck className="w-5 h-5" strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-bold tracking-tight">Manual Review</h2>
          <p className="text-xs text-muted-foreground tabular-nums">
            {reviewedCount}/{reviewItems.length} reviewed
            {skippedCount > 0 && ` · ${skippedCount} rejected excluded`} · click residuals on black canvas, then export
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2 flex-wrap">
          <div className="hidden sm:flex items-center gap-2 mr-1">
            <div className="w-28 h-2 rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-violet-600 transition-all duration-300"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-[11px] font-bold tabular-nums text-muted-foreground">{percentage}%</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={exitReviewMode}
            disabled={isRunning}
            className="rounded-xl font-semibold"
          >
            <LogOut className="w-3.5 h-3.5 mr-1.5" />
            Exit
          </Button>
          <Button
            size="sm"
            onClick={exportReviewedBatch}
            disabled={isRunning || exportableCount === 0 || !hasOutput}
            title={!hasOutput ? "Select an output folder first" : `Export ${exportableCount} assets`}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-[0_2px_8px_rgba(5,150,105,0.35)]"
          >
            {isExportingReview ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <PackageCheck className="w-3.5 h-3.5 mr-1.5" />
            )}
            Export reviewed ({exportableCount})
          </Button>
        </div>
      </div>
      {skippedCount > 0 && (
        <p className="text-[11px] font-semibold px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
          {skippedCount} rejected asset{skippedCount > 1 ? "s are" : " is"} excluded from final export.
        </p>
      )}
      {!hasOutput && (
        <p className="text-[11px] font-medium px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-700">
          Select an output folder above to enable final export. You can review assets meanwhile.
        </p>
      )}

      {/* Workspace grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        <div className="lg:col-span-3">
          <BatchReviewQueue />
        </div>
        <div className="lg:col-span-6">
          <BatchReviewPreview />
        </div>
        <div className="lg:col-span-3">
          <BatchReviewTools />
        </div>
      </div>
    </section>
  );
}
