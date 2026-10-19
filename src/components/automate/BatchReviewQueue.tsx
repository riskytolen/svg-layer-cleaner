"use client";

import { useMemo } from "react";
import { useBatchAutomationStore, ReviewFilter } from "@/store/batchAutomationStore";
import { Search, CheckCircle2, Circle, SkipForward, AlertTriangle, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const FILTER_TABS: { value: ReviewFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "ambiguous", label: "Ambiguous" },
  { value: "reviewed", label: "Reviewed" },
  { value: "skipped", label: "Rejected" },
];

export function BatchReviewQueue() {
  const reviewItems = useBatchAutomationStore((s) => s.reviewItems);
  const activeReviewId = useBatchAutomationStore((s) => s.activeReviewId);
  const reviewSearchQuery = useBatchAutomationStore((s) => s.reviewSearchQuery);
  const reviewFilter = useBatchAutomationStore((s) => s.reviewFilter);
  const selectReviewItem = useBatchAutomationStore((s) => s.selectReviewItem);
  const setReviewSearchQuery = useBatchAutomationStore((s) => s.setReviewSearchQuery);
  const setReviewFilter = useBatchAutomationStore((s) => s.setReviewFilter);

  const filtered = useMemo(() => {
    let list = reviewItems;
    if (reviewFilter === "pending") list = list.filter((r) => r.status === "pending-review");
    else if (reviewFilter === "reviewed") list = list.filter((r) => r.status === "reviewed");
    else if (reviewFilter === "skipped") list = list.filter((r) => r.status === "skipped");
    else if (reviewFilter === "ambiguous")
      list = list.filter((r) => r.status === "pending-review" && r.ambiguousCount > 0);
    const q = reviewSearchQuery.trim().toLowerCase();
    if (q) list = list.filter((r) => r.fileName.toLowerCase().includes(q));
    return list;
  }, [reviewItems, reviewFilter, reviewSearchQuery]);

  const reviewedCount = reviewItems.filter((r) => r.status === "reviewed").length;

  return (
    <div className="rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(16,24,40,0.05)] flex flex-col overflow-hidden h-full max-h-[720px]">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-violet-600 text-white flex items-center justify-center shrink-0">
            <ListChecks className="w-4 h-4" strokeWidth={2} />
          </span>
          <div>
            <h3 className="text-sm font-bold tracking-tight leading-tight">Review Queue</h3>
            <p className="text-[11px] text-muted-foreground tabular-nums">
              {reviewedCount}/{reviewItems.length} reviewed
            </p>
          </div>
        </div>
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search asset…"
            value={reviewSearchQuery}
            onChange={(e) => setReviewSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-background text-[13px] focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500"
          />
        </div>
        <div className="flex items-center gap-0.5 bg-muted rounded-xl p-1 mt-2.5 overflow-x-auto">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setReviewFilter(tab.value)}
              className={cn(
                "px-2 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap",
                reviewFilter === tab.value
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-2 space-y-1">
        {filtered.length === 0 && (
          <p className="px-3 py-8 text-center text-xs text-muted-foreground">
            No assets match this filter.
          </p>
        )}
        {filtered.map((item) => {
          const active = item.id === activeReviewId;
          const isRejected = item.status === "skipped";
          const StatusIcon =
            item.status === "reviewed" ? CheckCircle2 : item.status === "skipped" ? SkipForward : Circle;
          return (
            <button
              key={item.id}
              onClick={() => selectReviewItem(item.id)}
              className={cn(
                "w-full text-left rounded-xl border px-3 py-2.5 transition-all cursor-pointer",
                active
                  ? isRejected
                    ? "border-amber-400 bg-amber-50 shadow-[0_2px_8px_rgba(245,158,11,0.14)]"
                    : "border-violet-500 bg-violet-50/60 shadow-[0_2px_8px_rgba(124,58,237,0.12)]"
                  : isRejected
                    ? "border-amber-200 bg-amber-50/50 hover:border-amber-300 hover:bg-amber-50"
                    : "border-transparent hover:border-border hover:bg-muted/50",
              )}
            >
              <span className="flex items-center gap-2">
                <StatusIcon
                  className={cn(
                    "w-4 h-4 shrink-0",
                    item.status === "reviewed"
                      ? "text-emerald-600"
                      : item.status === "skipped"
                        ? "text-amber-600"
                        : "text-slate-300",
                  )}
                />
                <span className="flex-1 min-w-0">
                  <span className="block text-[13px] font-semibold truncate" title={item.fileName}>
                    {item.fileName}
                  </span>
                  <span className="block text-[11px] text-muted-foreground tabular-nums">
                    Auto {item.autoDeletedCount}
                    {item.manualDeletedCount > 0 && ` · Manual ${item.manualDeletedCount}`}
                    {isRejected && <span className="ml-1 font-bold text-amber-700">· Rejected</span>}
                    {item.ambiguousCount > 0 && (
                      <span className="inline-flex items-center gap-0.5 ml-1 text-amber-600 font-semibold">
                        <AlertTriangle className="w-3 h-3" />{item.ambiguousCount}
                      </span>
                    )}
                  </span>
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
