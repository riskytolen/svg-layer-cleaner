"use client";

import { useBatchAutomationStore } from "@/store/batchAutomationStore";
import { FileCheck, FileX, SkipForward, Trash2, FolderOutput, Files } from "lucide-react";

export function BatchSummary() {
  const summary = useBatchAutomationStore((s) => s.summary);
  const outputHandle = useBatchAutomationStore((s) => s.options.outputFolderHandle);

  if (summary.totalFiles === 0) return null;

  const stats = [
    { label: "Total", value: summary.totalFiles, icon: Files, color: "text-slate-600" },
    { label: "Processed", value: summary.processedFiles, icon: FileCheck, color: "text-blue-600" },
    { label: "Success", value: summary.successFiles, icon: FileCheck, color: "text-green-600" },
    { label: "Failed", value: summary.failedFiles, icon: FileX, color: "text-red-600" },
    { label: "Skipped", value: summary.skippedFiles, icon: SkipForward, color: "text-amber-600" },
    { label: "Deleted", value: summary.totalDeletedPaths, icon: Trash2, color: "text-orange-600" },
  ];

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 flex-1">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card">
              <Icon className={`w-3.5 h-3.5 ${stat.color} shrink-0`} />
              <div>
                <div className="text-sm font-bold leading-none">{stat.value}</div>
                <div className="text-[10px] text-muted-foreground">{stat.label}</div>
              </div>
            </div>
          );
        })}
      </div>
      {outputHandle && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <FolderOutput className="w-3 h-3" />
          {outputHandle.name}
        </div>
      )}
    </div>
  );
}
