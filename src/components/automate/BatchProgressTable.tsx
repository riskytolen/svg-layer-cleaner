"use client";

import { useBatchAutomationStore, ResultFilter } from "@/store/batchAutomationStore";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, SkipForward, Clock, Loader2, ChevronLeft, ChevronRight, Search, Eye, EyeOff, ChevronsUpDown } from "lucide-react";
import { useMemo } from "react";

const STATUS_MAP: Record<string, { label: string; icon: typeof CheckCircle; className: string }> = {
  pending: { label: "Pending", icon: Clock, className: "bg-slate-100 text-slate-700" },
  processing: { label: "Processing", icon: Loader2, className: "bg-blue-100 text-blue-700" },
  success: { label: "Success", icon: CheckCircle, className: "bg-green-100 text-green-700" },
  failed: { label: "Failed", icon: XCircle, className: "bg-red-100 text-red-700" },
  skipped: { label: "Skipped", icon: SkipForward, className: "bg-amber-100 text-amber-700" },
};

const FILTER_TABS: { value: ResultFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "success", label: "Success" },
  { value: "failed", label: "Failed" },
  { value: "skipped", label: "Skipped" },
  { value: "processing", label: "Processing" },
];

const ROW_OPTIONS = [25, 50, 100, 9999] as const;

export function BatchProgressTable() {
  const results = useBatchAutomationStore((s) => s.results);
  const isRunning = useBatchAutomationStore((s) => s.isRunning);
  const currentFileIndex = useBatchAutomationStore((s) => s.currentFileIndex);
  const totalFiles = useBatchAutomationStore((s) => s.totalFiles);
  const resultFilter = useBatchAutomationStore((s) => s.resultFilter);
  const resultSearchQuery = useBatchAutomationStore((s) => s.resultSearchQuery);
  const rowsPerPage = useBatchAutomationStore((s) => s.rowsPerPage);
  const currentPage = useBatchAutomationStore((s) => s.currentPage);
  const hideSuccessful = useBatchAutomationStore((s) => s.hideSuccessful);
  const expandedRowId = useBatchAutomationStore((s) => s.expandedRowId);
  const setResultFilter = useBatchAutomationStore((s) => s.setResultFilter);
  const setResultSearchQuery = useBatchAutomationStore((s) => s.setResultSearchQuery);
  const setRowsPerPage = useBatchAutomationStore((s) => s.setRowsPerPage);
  const setCurrentPage = useBatchAutomationStore((s) => s.setCurrentPage);
  const toggleHideSuccessful = useBatchAutomationStore((s) => s.toggleHideSuccessful);
  const setExpandedRowId = useBatchAutomationStore((s) => s.setExpandedRowId);

  const percentage = totalFiles > 0 ? Math.round((currentFileIndex / totalFiles) * 100) : 0;

  const filterCounts = useMemo(() => {
    const counts: Record<ResultFilter, number> = { all: results.length, success: 0, failed: 0, skipped: 0, processing: 0 };
    for (const r of results) {
      if (r.status === "success") counts.success++;
      else if (r.status === "failed") counts.failed++;
      else if (r.status === "skipped") counts.skipped++;
      else if (r.status === "processing") counts.processing++;
    }
    return counts;
  }, [results]);

  const filteredResults = useMemo(() => {
    let list = results;
    if (resultFilter !== "all") {
      list = list.filter((r) => r.status === resultFilter);
    }
    if (hideSuccessful) {
      list = list.filter((r) => r.status !== "success");
    }
    if (resultSearchQuery.trim()) {
      const q = resultSearchQuery.toLowerCase();
      list = list.filter((r) => r.fileName.toLowerCase().includes(q));
    }
    return list;
  }, [results, resultFilter, hideSuccessful, resultSearchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredResults.length / rowsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = (safePage - 1) * rowsPerPage;
  const paginatedResults = filteredResults.slice(startIdx, startIdx + rowsPerPage);

  if (results.length === 0 && !isRunning) return null;

  return (
    <div className="space-y-3">
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

      {/* Controls row */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search file name..."
            value={resultSearchQuery}
            onChange={(e) => setResultSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-md border border-border bg-background text-sm"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setResultFilter(tab.value)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                resultFilter === tab.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              <span className="ml-1 text-[10px] opacity-60">{filterCounts[tab.value]}</span>
            </button>
          ))}
        </div>

        {/* Hide success toggle */}
        <button
          onClick={() => toggleHideSuccessful()}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs border transition-colors ${
            hideSuccessful
              ? "border-orange-300 bg-orange-50 text-orange-700"
              : "border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          {hideSuccessful ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          Hide success
        </button>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="max-h-[420px] sm:max-h-[520px] lg:max-h-[640px] overflow-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 z-10 bg-slate-50 border-b border-border">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground w-10">#</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">File Name</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Path 1 Color</th>
                <th className="px-3 py-2 text-right font-medium text-muted-foreground w-16">Matched</th>
                <th className="px-3 py-2 text-right font-medium text-muted-foreground w-16">Deleted</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Exported</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground w-24">Error</th>
                <th className="px-2 py-2 w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedResults.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-3 py-8 text-center text-muted-foreground">
                    No results found.
                  </td>
                </tr>
              ) : (
                paginatedResults.map((r, i) => {
                  const statusInfo = STATUS_MAP[r.status];
                  const StatusIcon = statusInfo.icon;
                  const isExpanded = expandedRowId === r.id;
                  return (
                    <>
                      <tr
                        key={r.id}
                        className="hover:bg-muted/30 cursor-pointer"
                        onClick={() => setExpandedRowId(r.id)}
                      >
                        <td className="px-3 py-1.5 text-muted-foreground">{startIdx + i + 1}</td>
                        <td className="px-3 py-1.5 font-medium max-w-[360px] truncate" title={r.fileName}>
                          {r.fileName}
                        </td>
                        <td className="px-3 py-1.5">
                          {r.normalizedFill ? (
                            <span className="flex items-center gap-1.5">
                              <span
                                className="w-3 h-3 rounded-full border border-border inline-block shrink-0"
                                style={{ backgroundColor: r.normalizedFill }}
                              />
                              <span className="truncate max-w-[80px]">{r.normalizedFill}</span>
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
                        <td className="px-3 py-1.5 text-red-600 max-w-[160px] truncate" title={r.error || r.warning || ""}>
                          {r.error || r.warning || ""}
                        </td>
                        <td className="px-2 py-1.5">
                          <ChevronsUpDown className="w-3 h-3 text-muted-foreground" />
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${r.id}-detail`} className="bg-muted/20">
                          <td colSpan={9} className="px-4 py-3">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                              <div>
                                <span className="text-muted-foreground">Full name:</span>
                                <div className="font-medium break-all">{r.fileName}</div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Path 1 fill:</span>
                                <div className="font-medium">{r.normalizedFill || "N/A"}</div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Matched:</span>
                                <div className="font-medium">{r.matchedCount}</div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Deleted:</span>
                                <div className="font-medium">{r.deletedCount}</div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Exported:</span>
                                <div className="font-medium">{r.exportedFormats.join(", ") || "None"}</div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Output files:</span>
                                <div className="font-medium break-all">{r.outputNames.join(", ") || "None"}</div>
                              </div>
                              {(r.error || r.warning) && (
                                <div className="col-span-2 md:col-span-4">
                                  <span className="text-muted-foreground">Error/Warning:</span>
                                  <div className="text-red-600 break-all">{r.error || r.warning}</div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        {filteredResults.length > 0 && (
          <div className="flex items-center justify-between px-3 py-2 border-t border-border bg-slate-50 text-xs text-muted-foreground">
            <span>
              Showing {startIdx + 1}-{Math.min(startIdx + rowsPerPage, filteredResults.length)} of {filteredResults.length}
              {results.length !== filteredResults.length && ` (filtered from ${results.length})`}
            </span>
            <div className="flex items-center gap-2">
              <select
                value={rowsPerPage === 9999 ? "all" : rowsPerPage}
                onChange={(e) => setRowsPerPage(e.target.value === "all" ? 9999 : Number(e.target.value))}
                className="px-2 py-1 rounded border border-border bg-background text-xs"
              >
                <option value="25">25 / page</option>
                <option value="50">50 / page</option>
                <option value="100">100 / page</option>
                <option value="all">All</option>
              </select>
              <button
                onClick={() => setCurrentPage(Math.max(1, safePage - 1))}
                disabled={safePage <= 1}
                className="p-1 rounded hover:bg-muted disabled:opacity-30"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs">{safePage}/{totalPages}</span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, safePage + 1))}
                disabled={safePage >= totalPages}
                className="p-1 rounded hover:bg-muted disabled:opacity-30"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
