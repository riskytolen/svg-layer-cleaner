"use client";

import { useBatchAutomationStore, ResultFilter } from "@/store/batchAutomationStore";
import {
  CheckCircle2,
  XCircle,
  SkipForward,
  Clock,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Search,
  Eye,
  EyeOff,
  ChevronDown,
  TableProperties,
  FileSearch,
} from "lucide-react";
import { Fragment, useMemo } from "react";
import { cn } from "@/lib/utils/cn";

const STATUS_MAP: Record<
  string,
  { label: string; icon: typeof CheckCircle2; pill: string; dot: string }
> = {
  pending: { label: "Pending", icon: Clock, pill: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400" },
  processing: { label: "Processing", icon: Loader2, pill: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500 animate-pulse" },
  success: { label: "Success", icon: CheckCircle2, pill: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  failed: { label: "Failed", icon: XCircle, pill: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500" },
  skipped: { label: "Skipped", icon: SkipForward, pill: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" },
};

const FILTER_TABS: { value: ResultFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "success", label: "Success" },
  { value: "failed", label: "Failed" },
  { value: "skipped", label: "Skipped" },
  { value: "processing", label: "Processing" },
];

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

  const TH = "px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground whitespace-nowrap";

  return (
    <section className="rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(16,24,40,0.05)] overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-border">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
            <TableProperties className="w-4 h-4" strokeWidth={2} />
          </span>
          <div>
            <h2 className="text-sm font-bold tracking-tight leading-tight">File Results</h2>
            <p className="text-[11px] text-muted-foreground">
              {filteredResults.length} of {results.length} files
              {isRunning && ` · ${currentFileIndex}/${totalFiles} (${percentage}%)`}
            </p>
          </div>
          {isRunning && (
            <span className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-[11px] font-semibold text-blue-700">
              <Loader2 className="w-3 h-3 animate-spin" />
              Live
            </span>
          )}
        </div>

        {isRunning && (
          <div className="mt-3 h-1.5 rounded-full bg-slate-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-2.5 flex-wrap mt-4">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search file name…"
              value={resultSearchQuery}
              onChange={(e) => setResultSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-background text-[13px] focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
            />
          </div>
          <div className="flex items-center gap-0.5 bg-muted rounded-xl p-1">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setResultFilter(tab.value)}
                className={cn(
                  "px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                  resultFilter === tab.value
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
                <span className="ml-1 text-[10px] tabular-nums opacity-60">{filterCounts[tab.value]}</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => toggleHideSuccessful()}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer",
              hideSuccessful
                ? "border-orange-300 bg-orange-50 text-orange-700"
                : "border-border text-muted-foreground hover:text-foreground hover:border-slate-300",
            )}
          >
            {hideSuccessful ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            Hide success
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="max-h-[420px] sm:max-h-[520px] lg:max-h-[640px] overflow-auto">
        <table className="w-full text-[13px]">
          <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur border-b border-border">
            <tr>
              <th className={cn(TH, "w-12")}>#</th>
              <th className={TH}>File Name</th>
              <th className={TH}>BG Color</th>
              <th className={cn(TH, "text-right w-[76px]")}>Matched</th>
              <th className={cn(TH, "text-right w-[76px]")}>Deleted</th>
              <th className={cn(TH, "text-right w-[76px]")}>BG Gone</th>
              <th className={TH}>Exported</th>
              <th className={TH}>Status</th>
              <th className={cn(TH, "w-[180px]")}>Note</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {paginatedResults.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-12 text-center">
                  <FileSearch className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="mt-2 text-sm font-semibold">No results found</p>
                  <p className="text-xs text-muted-foreground">Try a different search or filter.</p>
                </td>
              </tr>
            ) : (
              paginatedResults.map((r, i) => {
                const statusInfo = STATUS_MAP[r.status];
                const StatusIcon = statusInfo.icon;
                const isExpanded = expandedRowId === r.id;
                return (
                  <Fragment key={r.id}>
                    <tr
                      className={cn(
                        "hover:bg-orange-50/40 cursor-pointer transition-colors",
                        isExpanded && "bg-orange-50/40",
                      )}
                      onClick={() => setExpandedRowId(r.id)}
                    >
                      <td className="px-4 py-2.5 text-muted-foreground tabular-nums">{startIdx + i + 1}</td>
                      <td className="px-4 py-2.5 font-semibold max-w-[320px] truncate" title={r.fileName}>
                        {r.fileName}
                      </td>
                      <td className="px-4 py-2.5">
                        {r.normalizedFill || r.bgColor ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-muted border border-border/60 font-mono text-[11px]">
                            <span
                              className="w-3 h-3 rounded-full border border-black/10 inline-block shrink-0"
                              style={{ backgroundColor: (r.normalizedFill || r.bgColor) as string }}
                            />
                            {r.normalizedFill || r.bgColor}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{r.matchedCount}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums font-semibold">{r.deletedCount}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-orange-700">
                        {r.bgRemoved ?? r.deletedCount}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">{r.exportedFormats.join(", ") || "—"}</td>
                      <td className="px-4 py-2.5">
                        <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-semibold whitespace-nowrap", statusInfo.pill)}>
                          <span className={cn("w-1.5 h-1.5 rounded-full", statusInfo.dot)} />
                          <StatusIcon className={cn("w-3 h-3", r.status === "processing" && "animate-spin")} />
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground max-w-[180px] truncate text-xs" title={r.error || r.warning || ""}>
                        {r.error || r.warning || <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-2 py-2.5">
                        <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", isExpanded && "rotate-180")} />
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-muted/40">
                        <td colSpan={10} className="px-5 py-4">
                          <dl className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3 text-xs">
                            {[
                              ["Full name", r.fileName, true],
                              ["BG color", r.bgColor || r.normalizedFill || "N/A", false],
                              ["Matched", String(r.matchedCount), false],
                              ["Deleted", String(r.deletedCount), false],
                              ["Ambiguous preserved", String(r.ambiguousCount ?? 0), false],
                              ["Foreground whites kept", String(r.preservedNearWhite ?? 0), false],
                              [
                                "Residual px cleaned",
                                (r.residualPixelsRemoved || 0) + (r.haloPixelsSoftened || 0) > 0
                                  ? `${r.residualPixelsRemoved || 0} + halo ${r.haloPixelsSoftened || 0}`
                                  : "0",
                                false,
                              ],
                              [
                                "Removed colors",
                                r.removedColors && Object.keys(r.removedColors).length > 0
                                  ? Object.entries(r.removedColors).map(([c, n]) => `${c} ×${n}`).join(", ")
                                  : "None",
                                true,
                              ],
                              ["Exported", r.exportedFormats.join(", ") || "None", false],
                              ["Output files", r.outputNames.join(", ") || "None", true],
                            ].map(([k, v, wide]) => (
                              <div key={k as string} className={cn(wide && "col-span-2 md:col-span-4")}>
                                <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{k}</dt>
                                <dd className="mt-0.5 font-medium break-all">{v}</dd>
                              </div>
                            ))}
                            {(r.error || r.warning) && (
                              <div className="col-span-2 md:col-span-4 rounded-lg bg-red-50 border border-red-100 px-3 py-2">
                                <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-red-600">
                                  {r.error ? "Error" : "Warning"}
                                </dt>
                                <dd className="mt-0.5 text-red-700 break-all">{r.error || r.warning}</dd>
                              </div>
                            )}
                          </dl>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination footer */}
      {filteredResults.length > 0 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-slate-50/60 text-xs text-muted-foreground">
          <span className="tabular-nums">
            Showing {startIdx + 1}–{Math.min(startIdx + rowsPerPage, filteredResults.length)} of {filteredResults.length}
            {results.length !== filteredResults.length && ` (filtered from ${results.length})`}
          </span>
          <div className="flex items-center gap-2">
            <select
              value={rowsPerPage === 9999 ? "all" : rowsPerPage}
              onChange={(e) => setRowsPerPage(e.target.value === "all" ? 9999 : Number(e.target.value))}
              className="px-2 py-1.5 rounded-lg border border-border bg-card text-xs font-medium focus:outline-none focus:border-orange-500"
            >
              <option value="25">25 / page</option>
              <option value="50">50 / page</option>
              <option value="100">100 / page</option>
              <option value="all">All</option>
            </select>
            <button
              onClick={() => setCurrentPage(Math.max(1, safePage - 1))}
              disabled={safePage <= 1}
              className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs tabular-nums font-semibold">{safePage}/{totalPages}</span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, safePage + 1))}
              disabled={safePage >= totalPages}
              className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
