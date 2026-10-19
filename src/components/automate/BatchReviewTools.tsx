"use client";

import { useMemo } from "react";
import { useBatchAutomationStore } from "@/store/batchAutomationStore";
import { getReviewLayerColors } from "@/lib/svg";
import { Button } from "@/components/ui/button";
import {
  MousePointerClick,
  Trash2,
  Pipette,
  Undo2,
  CheckCircle2,
  SkipForward,
  RotateCcw,
  Droplet,
  Brush,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

function Swatch({ color, label }: { color: string | null; label: string }) {
  return (
    <span className="flex items-center gap-1.5 min-w-0">
      <span
        className="w-4 h-4 rounded-md border border-black/15 shrink-0"
        style={{ backgroundColor: color || "transparent" }}
        title={color || "none"}
      />
      <span className="min-w-0">
        <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground leading-none">
          {label}
        </span>
        <span className="block text-[11px] font-mono font-semibold truncate leading-tight mt-0.5">
          {color || "—"}
        </span>
      </span>
    </span>
  );
}

export function BatchReviewTools() {
  const reviewItems = useBatchAutomationStore((s) => s.reviewItems);
  const activeReviewId = useBatchAutomationStore((s) => s.activeReviewId);
  const reviewSelectedLayerId = useBatchAutomationStore((s) => s.reviewSelectedLayerId);
  const reviewSelectedLayerIds = useBatchAutomationStore((s) => s.reviewSelectedLayerIds);
  const reviewColorTolerance = useBatchAutomationStore((s) => s.options.reviewColorTolerance);
  const reviewLastAction = useBatchAutomationStore((s) => s.reviewLastAction);
  const selectSameReviewColor = useBatchAutomationStore((s) => s.selectSameReviewColor);
  const deleteReviewSelection = useBatchAutomationStore((s) => s.deleteReviewSelection);
  const deleteReviewSameColor = useBatchAutomationStore((s) => s.deleteReviewSameColor);
  const undoReviewEdit = useBatchAutomationStore((s) => s.undoReviewEdit);
  const markActiveReviewed = useBatchAutomationStore((s) => s.markActiveReviewed);
  const markActiveSkipped = useBatchAutomationStore((s) => s.markActiveSkipped);
  const restoreActiveSkipped = useBatchAutomationStore((s) => s.restoreActiveSkipped);

  const item = reviewItems.find((r) => r.id === activeReviewId) || null;

  const colors = useMemo(() => {
    if (!item || !reviewSelectedLayerId) return { fill: null as string | null, stroke: null as string | null };
    try {
      return getReviewLayerColors(item.doc, reviewSelectedLayerId);
    } catch {
      return { fill: null, stroke: null };
    }
  }, [item, reviewSelectedLayerId]);

  const canAct = !!item && !!reviewSelectedLayerId;
  const canUndo = !!item && item.history.length > 0;
  const isRejected = item?.status === "skipped";

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-[0_1px_2px_rgba(16,24,40,0.05)] space-y-4 h-full max-h-[720px] overflow-auto">
      <div className="flex items-center gap-2.5">
        <span className="w-8 h-8 rounded-lg bg-violet-600 text-white flex items-center justify-center shrink-0">
          <MousePointerClick className="w-4 h-4" strokeWidth={2} />
        </span>
        <div>
          <h3 className="text-sm font-bold tracking-tight leading-tight">Manual Cleanup</h3>
          <p className="text-[11px] text-muted-foreground">Click a color, then delete</p>
        </div>
      </div>

      {/* Selection info */}
      <div className="rounded-xl bg-muted/60 border border-border/60 p-3">
        {reviewSelectedLayerId ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Selected
              </span>
              <span className="text-[11px] font-bold tabular-nums px-1.5 py-0.5 rounded-md bg-violet-100 text-violet-700">
                {reviewSelectedLayerIds.length} object{reviewSelectedLayerIds.length > 1 ? "s" : ""}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Swatch color={colors.fill} label="Fill" />
              <Swatch color={colors.stroke} label="Stroke" />
            </div>
            <p className="text-[10px] text-muted-foreground font-mono truncate" title={reviewSelectedLayerId}>
              {reviewSelectedLayerId}
            </p>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Click any residual white or color on the canvas to inspect it here.
          </p>
        )}
      </div>

      {/* Feedback */}
      {reviewLastAction && (
        <p className="text-[11px] font-medium px-2.5 py-2 rounded-lg bg-blue-50 border border-blue-100 text-blue-700">
          {reviewLastAction}
        </p>
      )}

      {/* Select same */}
      <div>
        <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-1.5">
          Select same
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          <Button
            variant="outline"
            size="sm"
            disabled={!canAct}
            onClick={() => selectSameReviewColor("fill")}
            className="rounded-xl text-xs font-semibold"
          >
            <Pipette className="w-3.5 h-3.5 mr-1" />
            Fill
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!canAct}
            onClick={() => selectSameReviewColor("stroke")}
            className="rounded-xl text-xs font-semibold"
          >
            <Brush className="w-3.5 h-3.5 mr-1" />
            Stroke
          </Button>
        </div>
        <p className="mt-1.5 text-[10px] text-muted-foreground tabular-nums">
          Tolerance {reviewColorTolerance} · change in options
        </p>
      </div>

      {/* Delete */}
      <div>
        <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-1.5">
          Delete
        </span>
        <div className="space-y-1.5">
          <Button
            variant="destructive"
            size="sm"
            disabled={!canAct}
            onClick={deleteReviewSelection}
            className="w-full rounded-xl text-xs font-bold"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            Delete selected
          </Button>
          <div className="grid grid-cols-3 gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={!canAct}
              onClick={() => deleteReviewSameColor("fill")}
              className="rounded-xl text-[11px] font-bold hover:text-red-600 hover:border-red-300 hover:bg-red-50"
              title="Delete all with same fill"
            >
              <Droplet className="w-3.5 h-3.5 mr-1" />
              Fill
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!canAct}
              onClick={() => deleteReviewSameColor("stroke")}
              className="rounded-xl text-[11px] font-bold hover:text-red-600 hover:border-red-300 hover:bg-red-50"
              title="Delete all with same stroke"
            >
              Stroke
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!canAct}
              onClick={() => deleteReviewSameColor("fill-and-stroke")}
              className="rounded-xl text-[11px] font-bold hover:text-red-600 hover:border-red-300 hover:bg-red-50"
              title="Delete all with same fill and stroke"
            >
              Both
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            disabled={!canUndo}
            onClick={undoReviewEdit}
            className="w-full rounded-xl text-xs font-semibold text-muted-foreground"
          >
            <Undo2 className="w-3.5 h-3.5 mr-1.5" />
            Undo manual edit{item ? ` (${item.history.length})` : ""}
          </Button>
        </div>
      </div>

      {/* Progress */}
      <div className={cn("pt-3 border-t border-border space-y-1.5")}>
        {isRejected && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-800">
            Rejected asset. It will be excluded from export.
          </div>
        )}
        <Button
          size="sm"
          disabled={!item || isRejected}
          onClick={markActiveReviewed}
          className="w-full h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[13px]"
        >
          <CheckCircle2 className="w-4 h-4 mr-1.5" />
          Mark reviewed & next
        </Button>
        {isRejected ? (
          <Button
            variant="outline"
            size="sm"
            disabled={!item}
            onClick={restoreActiveSkipped}
            className="w-full rounded-xl text-xs font-bold border-emerald-200 text-emerald-700 hover:bg-emerald-50"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            Restore asset
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            disabled={!item}
            onClick={markActiveSkipped}
            title="Reject this asset so it will not be exported"
            className="w-full rounded-xl text-xs font-bold border-red-200 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <SkipForward className="w-3.5 h-3.5 mr-1.5" />
            Reject asset - exclude export
          </Button>
        )}
      </div>
    </div>
  );
}
