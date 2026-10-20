"use client";

import { useMemo } from "react";
import { useBatchAutomationStore } from "@/store/batchAutomationStore";
import { getReviewLayerColors, normalizeReviewColorInput } from "@/lib/svg";
import type { ReviewColorProperty } from "@/lib/svg";
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
  ListMinus,
  X,
  PaintBucket,
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
  const reviewSelectionMode = useBatchAutomationStore((s) => s.reviewSelectionMode);
  const setReviewSelectionMode = useBatchAutomationStore((s) => s.setReviewSelectionMode);
  const reviewPickColorMode = useBatchAutomationStore((s) => s.reviewPickColorMode);
  const setReviewPickColorMode = useBatchAutomationStore((s) => s.setReviewPickColorMode);
  const reviewColorProperty = useBatchAutomationStore((s) => s.reviewColorProperty);
  const setReviewColorProperty = useBatchAutomationStore((s) => s.setReviewColorProperty);
  const reviewEditColor = useBatchAutomationStore((s) => s.reviewEditColor);
  const setReviewEditColor = useBatchAutomationStore((s) => s.setReviewEditColor);
  const applyReviewColor = useBatchAutomationStore((s) => s.applyReviewColor);
  const clearReviewSelection = useBatchAutomationStore((s) => s.clearReviewSelection);
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
  const hasSelection = !!item && reviewSelectedLayerIds.length > 0;
  const isDeselecting = reviewSelectionMode === "subtract";
  const canUndo = !!item && item.history.length > 0;
  const isRejected = item?.status === "skipped";
  const pickerHex = normalizeReviewColorInput(reviewEditColor);
  const pickerValue = pickerHex ?? "#000000";
  const propertyLabel: ReviewColorProperty = reviewColorProperty;

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

      {/* Refine the existing selection without changing the SVG. */}
      <div className="space-y-1.5">
        <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
          Refine selection
        </span>
        <div className="flex gap-1.5">
          <Button
            variant="outline"
            size="sm"
            disabled={!item || (!hasSelection && !isDeselecting)}
            aria-pressed={isDeselecting}
            onClick={() => setReviewSelectionMode(isDeselecting ? "select" : "subtract")}
            className={cn(
              "flex-1 rounded-xl text-xs font-semibold",
              isDeselecting && "border-violet-300 bg-violet-50 text-violet-700 hover:bg-violet-100 hover:text-violet-800",
            )}
            title="Toggle deselect mode. Clicking removes only that object from the selection."
          >
            <ListMinus className="w-3.5 h-3.5 mr-1" />
            {isDeselecting ? "Done deselecting" : "Deselect objects"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!hasSelection}
            onClick={clearReviewSelection}
            className="rounded-xl px-2"
            title="Clear all selections"
            aria-label="Clear all selections"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
        <p className="text-[10px] leading-relaxed text-muted-foreground">
          {isDeselecting
            ? "Click selected objects to deselect them. Others stay selected. Use Delete selected to delete only the remaining selection."
            : "Ctrl/Cmd or Shift+click adds or removes one object without clearing the others. Deselect mode also works with touch."}
        </p>
      </div>

      {/* Change color of the current selection */}
      <div className="space-y-1.5">
        <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
          Change color
        </span>
        <div className="flex gap-1.5">
          {(["fill", "stroke"] as const).map((property) => {
            const active = reviewColorProperty === property;
            return (
              <Button
                key={property}
                variant="outline"
                size="sm"
                onClick={() => setReviewColorProperty(property)}
                aria-pressed={active}
                className={cn(
                  "flex-1 rounded-xl text-xs font-semibold",
                  active && "border-violet-300 bg-violet-50 text-violet-700 hover:bg-violet-100 hover:text-violet-800",
                )}
                title={active ? `Currently editing ${property}` : `Switch to editing ${property}`}
              >
                {property === "fill" ? "Fill" : "Stroke"}
              </Button>
            );
          })}
        </div>
        <div className="flex items-center gap-1.5">
          <input
            type="color"
            value={pickerValue}
            onChange={(e) => setReviewEditColor(e.target.value.toUpperCase())}
            className="w-9 h-8 p-0.5 rounded-lg border border-input bg-background cursor-pointer shrink-0"
            title="Pick a color"
            aria-label="Edit color picker"
          />
          <input
            type="text"
            value={reviewEditColor ?? ""}
            onChange={(e) => setReviewEditColor(e.target.value.trim())}
            placeholder="#RRGGBB"
            spellCheck={false}
            className="min-w-0 flex-1 h-8 rounded-lg border border-input bg-background px-2 font-mono text-xs uppercase tracking-tight focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            aria-label="Edit color hex value"
          />
          <Button
            variant="outline"
            size="sm"
            disabled={!item}
            aria-pressed={reviewPickColorMode}
            onClick={() => setReviewPickColorMode(!reviewPickColorMode)}
            className={cn(
              "rounded-xl px-2 shrink-0",
              reviewPickColorMode && "border-violet-300 bg-violet-50 text-violet-700 hover:bg-violet-100 hover:text-violet-800",
            )}
            title="Pick a color from any object on the canvas. Your selection stays intact."
            aria-label="Pick color from canvas"
          >
            <Pipette className="w-3.5 h-3.5" />
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={!hasSelection || !pickerHex}
          onClick={applyReviewColor}
          className="w-full rounded-xl text-xs font-bold"
          title={`Change the ${propertyLabel} of ${reviewSelectedLayerIds.length} selected object${reviewSelectedLayerIds.length > 1 ? "s" : ""}`}
        >
          <PaintBucket className="w-3.5 h-3.5 mr-1.5" />
          Apply color{hasSelection ? ` (${reviewSelectedLayerIds.length})` : ""}
        </Button>
        <p className="text-[10px] leading-relaxed text-muted-foreground">
          Edits the {propertyLabel} of every selected object. With the pipette active, click another object to copy
          its color; your selection is kept. Use Undo to restore the previous color.
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
            disabled={!hasSelection}
            onClick={deleteReviewSelection}
            title="Delete only the objects still selected, keeping deselected objects"
            className="w-full rounded-xl text-xs font-bold"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            Delete selected
          </Button>
          <p className="text-[10px] text-muted-foreground">Delete all by color (ignores selection):</p>
          <div className="grid grid-cols-3 gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={!canAct}
              onClick={() => deleteReviewSameColor("fill")}
              className="rounded-xl text-[11px] font-bold hover:text-red-600 hover:border-red-300 hover:bg-red-50"
              title="Delete ALL with same fill, including objects you deselected"
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
              title="Delete ALL with same stroke, including objects you deselected"
            >
              Stroke
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!canAct}
              onClick={() => deleteReviewSameColor("fill-and-stroke")}
              className="rounded-xl text-[11px] font-bold hover:text-red-600 hover:border-red-300 hover:bg-red-50"
              title="Delete ALL with same fill and stroke, including objects you deselected"
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
