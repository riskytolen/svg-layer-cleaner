"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CleanSvgResult } from "@/types/svg";

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

function SummaryRow({ label, value }: { label: string; value: number }) {
  if (value === 0) return null;
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-medium">{value}</span>
    </div>
  );
}

type CleanSummaryDialogProps = {
  open: boolean;
  result: CleanSvgResult | null;
  onClose: () => void;
};

export function CleanSummaryDialog({ open, result, onClose }: CleanSummaryDialogProps) {
  if (!result) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Clean Summary</DialogTitle>
          <DialogDescription className="text-sm">
            SVG cleaning completed successfully.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Removed items */}
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Removed
            </p>
            <div className="bg-muted rounded-md p-2">
              <SummaryRow label="Empty paths" value={result.removedEmptyPaths} />
              <SummaryRow label="Paths without d" value={result.removedPathsWithoutD} />
              <SummaryRow label="Empty groups" value={result.removedEmptyGroups} />
              <SummaryRow label="Comments" value={result.removedComments} />
              <SummaryRow label="Metadata" value={result.removedMetadata} />
              <SummaryRow label="Hidden elements" value={result.removedHiddenElements} />
              <SummaryRow label="Elements without fill/stroke" value={result.removedElementsWithoutFillAndStroke} />
              <SummaryRow label="Empty defs" value={result.removedEmptyDefs} />
              <SummaryRow label="Editor attributes" value={result.removedEditorAttributes} />
              {result.totalRemoved === 0 && (
                <p className="text-xs text-muted-foreground italic">No items removed</p>
              )}
            </div>
          </div>

          {/* File size */}
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              File Size
            </p>
            <div className="bg-muted rounded-md p-2 space-y-0.5">
              <div className="flex items-center justify-between py-0.5">
                <span className="text-xs text-muted-foreground">Before</span>
                <span className="text-xs font-medium">{formatBytes(result.beforeSize)}</span>
              </div>
              <div className="flex items-center justify-between py-0.5">
                <span className="text-xs text-muted-foreground">After</span>
                <span className="text-xs font-medium">{formatBytes(result.afterSize)}</span>
              </div>
              <div className="border-t border-border my-1" />
              <div className="flex items-center justify-between py-0.5">
                <span className="text-xs text-green-600 font-medium">Reduced</span>
                <span className="text-xs font-medium text-green-600">
                  {formatBytes(result.reducedSize)} ({result.reducedPercentage}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button size="sm" onClick={onClose}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
