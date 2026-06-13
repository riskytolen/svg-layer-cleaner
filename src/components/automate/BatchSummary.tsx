"use client";

import { useBatchAutomationStore } from "@/store/batchAutomationStore";
import { FileCheck, FileX, SkipForward, Trash2, FolderOutput } from "lucide-react";

export function BatchSummary() {
  const summary = useBatchAutomationStore((s) => s.summary);
  const outputHandle = useBatchAutomationStore((s) => s.options.outputFolderHandle);

  if (summary.totalFiles === 0) return null;

  const stats = [
    { label: "Total Files", value: summary.totalFiles, icon: FileCheck, className: "text-slate-600" },
    { label: "Processed", value: summary.processedFiles, icon: FileCheck, className: "text-blue-600" },
    { label: "Success", value: summary.successFiles, icon: FileCheck, className: "text-green-600" },
    { label: "Failed", value: summary.failedFiles, icon: FileX, className: "text-red-600" },
    { label: "Skipped", value: summary.skippedFiles, icon: SkipForward, className: "text-yellow-600" },
    { label: "Total Deleted", value: summary.totalDeletedPaths, icon: Trash2, className: "text-orange-600" },
  ];

  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Summary
      </div>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="p-3 rounded-lg border border-border bg-card text-center">
              <Icon className={`w-4 h-4 mx-auto mb-1 ${stat.className}`} />
              <div className="text-lg font-bold">{stat.value}</div>
              <div className="text-[10px] text-muted-foreground">{stat.label}</div>
            </div>
          );
        })}
      </div>
      {outputHandle && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <FolderOutput className="w-3 h-3" />
          Output: {outputHandle.name}
        </div>
      )}
    </div>
  );
}
