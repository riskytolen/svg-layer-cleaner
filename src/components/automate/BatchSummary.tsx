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
    { label: "Total Files", value: summary.totalFiles, icon: Files, tile: "bg-zinc-500/10 text-zinc-400" },
    { label: "Success", value: summary.successFiles, icon: FileCheck, tile: "bg-emerald-500/10 text-emerald-400" },
    { label: "Failed", value: summary.failedFiles, icon: FileX, tile: "bg-red-500/10 text-red-400" },
    { label: "Skipped", value: summary.skippedFiles, icon: SkipForward, tile: "bg-amber-500/10 text-amber-400" },
    {
      label: "BG Removed",
      value: summary.totalBgRemoved ?? summary.totalDeletedPaths,
      icon: Eraser,
      tile: "bg-orange-500/10 text-orange-400",
    },
    {
      label: "PX Cleaned",
      value: summary.totalResidualPixels ?? 0,
      icon: Sparkles,
      tile: "bg-cyan-500/10 text-cyan-400",
    },
  ];

  return (
    <section className="rounded-lg border border-border bg-card p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.35)]">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Batch Results</h2>
        </div>
        {outputHandle && (
          <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-background border border-border text-[11px] text-muted-foreground font-mono max-w-[280px]">
            <FolderOutput className="w-3 h-3 shrink-0 text-emerald-400" />
            <span className="truncate">{outputHandle.name}</span>
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2 mt-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-md border border-border/70 bg-background px-3 py-2.5 flex items-center gap-3 hover:border-[#46464f] transition-colors"
            >
              <span className={cn("w-8 h-8 rounded-md flex items-center justify-center shrink-0", stat.tile)}>
                <Icon className="w-4 h-4" strokeWidth={2} />
              </span>
              <div className="min-w-0">
                <div className="text-lg font-bold tracking-tight tabular-nums leading-none">
                  {stat.value.toLocaleString()}
                </div>
                <div className="mt-1 text-[9.5px] font-bold uppercase tracking-[0.12em] text-muted-foreground truncate">
                  {stat.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
