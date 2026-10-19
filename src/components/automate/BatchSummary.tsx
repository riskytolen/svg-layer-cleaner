"use client";

import { useBatchAutomationStore } from "@/store/batchAutomationStore";
import {
  FileCheck,
  FileX,
  SkipForward,
  Eraser,
  Sparkles,
  Files,
  FolderOutput,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function BatchSummary() {
  const summary = useBatchAutomationStore((s) => s.summary);
  const outputHandle = useBatchAutomationStore((s) => s.options.outputFolderHandle);

  if (summary.totalFiles === 0) return null;

  const stats = [
    { label: "Total Files", value: summary.totalFiles, icon: Files, tile: "bg-slate-100 text-slate-600" },
    { label: "Success", value: summary.successFiles, icon: FileCheck, tile: "bg-emerald-50 text-emerald-600" },
    { label: "Failed", value: summary.failedFiles, icon: FileX, tile: "bg-red-50 text-red-600" },
    { label: "Skipped", value: summary.skippedFiles, icon: SkipForward, tile: "bg-amber-50 text-amber-600" },
    {
      label: "BG Removed",
      value: summary.totalBgRemoved ?? summary.totalDeletedPaths,
      icon: Eraser,
      tile: "bg-orange-50 text-orange-600",
    },
    {
      label: "PX Cleaned",
      value: summary.totalResidualPixels ?? 0,
      icon: Sparkles,
      tile: "bg-cyan-50 text-cyan-600",
    },
  ];

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-sm font-bold tracking-tight">Batch Results</h2>
          <p className="text-xs text-muted-foreground">Live summary of the current run</p>
        </div>
        {outputHandle && (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-xs text-muted-foreground font-medium max-w-[240px]">
            <FolderOutput className="w-3 h-3 shrink-0" />
            <span className="truncate">{outputHandle.name}</span>
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 mt-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-xl border border-border/70 bg-background p-3.5 hover:shadow-sm transition-shadow"
            >
              <span className={cn("w-9 h-9 rounded-xl flex items-center justify-center", stat.tile)}>
                <Icon className="w-4.5 h-4.5" strokeWidth={2} />
              </span>
              <div className="mt-2.5 text-2xl font-bold tracking-tight tabular-nums leading-none">
                {stat.value.toLocaleString()}
              </div>
              <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                {stat.label}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
