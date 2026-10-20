"use client";

import { useRef } from "react";
import { useBatchAutomationStore } from "@/store/batchAutomationStore";
import { selectExportableReviewItems } from "@/lib/project/reviewProject";
import { BatchReviewQueue } from "./BatchReviewQueue";
import { BatchReviewPreview } from "./BatchReviewPreview";
import { BatchReviewTools } from "./BatchReviewTools";
import { Button } from "@/components/ui/button";
import {
  ClipboardCheck,
  PackageCheck,
  LogOut,
  Loader2,
  Save,
  FolderOpen,
  Trash2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function BatchReviewWorkspace() {
  const reviewItems = useBatchAutomationStore((s) => s.reviewItems);
  const isReviewMode = useBatchAutomationStore((s) => s.isReviewMode);
  const isExportingReview = useBatchAutomationStore((s) => s.isExportingReview);
  const isRunning = useBatchAutomationStore((s) => s.isRunning);
  const hasOutput = useBatchAutomationStore((s) => !!s.options.outputFolderHandle);
  const exportReviewedBatch = useBatchAutomationStore((s) => s.exportReviewedBatch);
  const exitReviewMode = useBatchAutomationStore((s) => s.exitReviewMode);

  // Project save/restore + export scope
  const reviewExportScope = useBatchAutomationStore((s) => s.reviewExportScope);
  const setReviewExportScope = useBatchAutomationStore((s) => s.setReviewExportScope);
  const autosaveState = useBatchAutomationStore((s) => s.autosaveState);
  const autosaveError = useBatchAutomationStore((s) => s.autosaveError);
  const hasAutosaveDraft = useBatchAutomationStore((s) => s.hasAutosaveDraft);
  const autosaveDraftMeta = useBatchAutomationStore((s) => s.autosaveDraftMeta);
  const discardAutosave = useBatchAutomationStore((s) => s.discardAutosave);
  const saveProjectFile = useBatchAutomationStore((s) => s.saveProjectFile);
  const openProjectFile = useBatchAutomationStore((s) => s.openProjectFile);
  const isRestoringProject = useBatchAutomationStore((s) => s.isRestoringProject);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isReviewMode) return null;

  const exportSummary = selectExportableReviewItems(reviewItems, reviewExportScope);
  const exportableCount = exportSummary.exportable.length;
  const pendingForScope = exportSummary.pendingCount;
  const reviewedCount = exportSummary.reviewedCount;
  const skippedCount = reviewItems.filter((r) => r.status === "skipped").length;
  const allEligibleCount = reviewItems.length - skippedCount;
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
          <AutosavePill state={autosaveState} error={autosaveError} />
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
            title={
              !hasOutput
                ? "Select an output folder first"
                : reviewExportScope === "reviewed-only"
                  ? `Export ${reviewedCount} asset${reviewedCount > 1 ? "s" : ""} marked reviewed`
                  : `Export ${exportableCount} asset${exportableCount > 1 ? "s" : ""} (pending assets included)`
            }
            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-[0_2px_8px_rgba(5,150,105,0.35)]"
          >
            {isExportingReview ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <PackageCheck className="w-3.5 h-3.5 mr-1.5" />
            )}
            {reviewExportScope === "reviewed-only" ? "Export reviewed" : "Export all eligible"} ({exportableCount})
          </Button>
        </div>
      </div>

      {/* Project + export scope toolbar */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-violet-100">
        <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Export</span>
        <div className="flex rounded-xl border border-violet-200 bg-white p-0.5" role="group" aria-label="Export scope">
          <button
            type="button"
            aria-pressed={reviewExportScope === "reviewed-only"}
            onClick={() => setReviewExportScope("reviewed-only")}
            className={cn(
              "px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors",
              reviewExportScope === "reviewed-only"
                ? "bg-violet-600 text-white shadow-[0_1px_4px_rgba(124,58,237,0.4)]"
                : "text-slate-600 hover:bg-violet-50",
            )}
            title="Only assets marked reviewed will be exported"
          >
            Reviewed only ({reviewedCount})
          </button>
          <button
            type="button"
            aria-pressed={reviewExportScope === "all-eligible"}
            onClick={() => setReviewExportScope("all-eligible")}
            className={cn(
              "px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors",
              reviewExportScope === "all-eligible"
                ? "bg-violet-600 text-white shadow-[0_1px_4px_rgba(124,58,237,0.4)]"
                : "text-slate-600 hover:bg-violet-50",
            )}
            title="Export all pending + reviewed assets; rejected assets stay excluded"
          >
            All eligible ({allEligibleCount})
          </button>
        </div>
        <span className="h-5 w-px bg-violet-200" role="presentation" />
        <Button
          variant="outline"
          size="sm"
          disabled={isRestoringProject || reviewItems.length === 0}
          onClick={saveProjectFile}
          className="rounded-xl font-semibold text-xs"
          title="Download this review session as a project file (SVG edits, statuses, undo history, options)"
        >
          <Save className="w-3.5 h-3.5 mr-1.5" />
          Save project
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={isRestoringProject}
          onClick={() => fileInputRef.current?.click()}
          className="rounded-xl font-semibold text-xs"
          title="Open a project file and continue the saved review session"
        >
          {isRestoringProject ? (
            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
          ) : (
            <FolderOpen className="w-3.5 h-3.5 mr-1.5" />
          )}
          Open project
        </Button>
        {hasAutosaveDraft && (
          <Button
            variant="outline"
            size="sm"
            disabled={isRestoringProject}
            onClick={discardAutosave}
            className="rounded-xl px-2"
            title={`Delete the browser autosave draft${autosaveDraftMeta ? ` (${autosaveDraftMeta.itemCount} assets)` : ""}`}
            aria-label="Delete autosave draft"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
          </Button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void openProjectFile(file);
            e.currentTarget.value = "";
          }}
        />
      </div>

      {skippedCount > 0 && (
        <p className="text-[11px] font-semibold px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
          {skippedCount} rejected asset{skippedCount > 1 ? "s are" : " is"} excluded from final export.
        </p>
      )}
      {reviewExportScope === "all-eligible" && pendingForScope > 0 && (
        <p className="text-[11px] font-semibold px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
          Warning: {pendingForScope} asset{pendingForScope > 1 ? "s" : ""} not yet marked reviewed will be included in this export.
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

function AutosavePill({ state, error }: { state: "idle" | "saving" | "saved" | "error"; error: string | null }) {
  if (state === "idle") return null;
  const meta: Record<string, { className: string; label: string; icon: React.ReactNode }> = {
    saving: {
      className: "bg-blue-50 text-blue-700 border-blue-200",
      label: "Saving…",
      icon: <Loader2 className="w-3 h-3 animate-spin" />,
    },
    saved: {
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
      label: "Autosaved",
      icon: <CheckCircle2 className="w-3 h-3" />,
    },
    error: {
      className: "bg-rose-50 text-rose-700 border-rose-200",
      label: error ? "Autosave error" : "Autosave error",
      icon: <AlertCircle className="w-3 h-3" />,
    },
  };
  const item = meta[state] ?? meta.saving;
  return (
    <span
      className={cn(
        "hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold",
        item.className,
      )}
      title={state === "error" ? error ?? undefined : "This review session is auto-saved in this browser"}
    >
      {item.icon}
      {item.label}
    </span>
  );
}
