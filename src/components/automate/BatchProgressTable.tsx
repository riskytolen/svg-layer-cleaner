"use client";

import { useBatchAutomationStore } from "@/store/batchAutomationStore";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, SkipForward, Clock, Loader2 } from "lucide-react";

const STATUS_MAP: Record<string, { label: string; icon: typeof CheckCircle; className: string }> = {
  pending: { label: "Pending", icon: Clock, className: "bg-slate-100 text-slate-700" },
  processing: { label: "Processing", icon: Loader2, className: "bg-blue-100 text-blue-700" },
  success: { label: "Success", icon: CheckCircle, className: "bg-green-100 text-green-700" },
  failed: { label: "Failed", icon: XCircle, className: "bg-red-100 text-red-700" },
  skipped: { label: "Skipped", icon: SkipForward, className: "bg-yellow-100 text-yellow-700" },
};

export function BatchProgressTable() {
  const results = useBatchAutomationStore((s) => s.results);
  const isRunning = useBatchAutomationStore((s) => s.isRunning);
  const currentFileIndex = useBatchAutomationStore((s) => s.currentFileIndex);
  const totalFiles = useBatchAutomationStore((s) => s.totalFiles);

  if (results.length === 0 && !isRunning) return null;

  const percentage = totalFiles > 0 ? Math.round((currentFileIndex / totalFiles) * 100) : 0;

  return (
    <div className="space-y-2">
      {/* Progress bar */}
      {isRunning && (
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {currentFileIndex}/{totalFiles} ({percentage}%)
          </span>
        </div>
      )}

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">#</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">File Name</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Path 1 Color</th>
              <th className="px-3 py-2 text-right font-medium text-muted-foreground">Matched</th>
              <th className="px-3 py-2 text-right font-medium text-muted-foreground">Deleted</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Exported</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Error</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {results.map((r, i) => {
              const statusInfo = STATUS_MAP[r.status];
              const StatusIcon = statusInfo.icon;
              return (
                <tr key={r.id} className="hover:bg-muted/30">
                  <td className="px-3 py-1.5 text-muted-foreground">{i + 1}</td>
                  <td className="px-3 py-1.5 font-medium truncate max-w-[200px]" title={r.fileName}>
                    {r.fileName}
                  </td>
                  <td className="px-3 py-1.5">
                    {r.normalizedFill ? (
                      <span className="flex items-center gap-1.5">
                        <span
                          className="w-3 h-3 rounded-full border border-border inline-block"
                          style={{ backgroundColor: r.normalizedFill }}
                        />
                        {r.normalizedFill}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-3 py-1.5 text-right">{r.matchedCount}</td>
                  <td className="px-3 py-1.5 text-right">{r.deletedCount}</td>
                  <td className="px-3 py-1.5">{r.exportedFormats.join(", ") || "-"}</td>
                  <td className="px-3 py-1.5">
                    <Badge variant="secondary" className={`${statusInfo.className} text-[10px]`}>
                      <StatusIcon className={`w-2.5 h-2.5 mr-0.5 ${r.status === "processing" ? "animate-spin" : ""}`} />
                      {statusInfo.label}
                    </Badge>
                  </td>
                  <td className="px-3 py-1.5 text-red-600 max-w-[200px] truncate" title={r.error || r.warning || ""}>
                    {r.error || r.warning || ""}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
