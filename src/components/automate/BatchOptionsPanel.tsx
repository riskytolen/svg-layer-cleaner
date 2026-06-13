"use client";

import { useBatchAutomationStore } from "@/store/batchAutomationStore";

export function BatchOptionsPanel() {
  const options = useBatchAutomationStore((s) => s.options);
  const updateOptions = useBatchAutomationStore((s) => s.updateOptions);

  return (
    <div className="p-3 rounded-lg border border-border bg-card space-y-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Processing Options
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={options.autoResize2500}
            onChange={(e) => updateOptions({ autoResize2500: e.target.checked })}
            className="rounded"
          />
          Auto resize to 2500x2500
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={options.quickClean}
            onChange={(e) => updateOptions({ quickClean: e.target.checked })}
            className="rounded"
          />
          Quick Clean SVG
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={options.removeSameFillAsFirstPath}
            onChange={(e) => updateOptions({ removeSameFillAsFirstPath: e.target.checked })}
            className="rounded"
          />
          Remove same fill as Path 1
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={options.skipSystemLayers}
            onChange={(e) => updateOptions({ skipSystemLayers: e.target.checked })}
            className="rounded"
          />
          Skip system/background layers
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={options.recursive}
            onChange={(e) => updateOptions({ recursive: e.target.checked })}
            className="rounded"
          />
          Recursive scan subfolders
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={options.overwriteExisting}
            onChange={(e) => updateOptions({ overwriteExisting: e.target.checked })}
            className="rounded"
          />
          Overwrite existing files
        </label>
      </div>

      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground pt-2 border-t border-border">
        Safety Options
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={options.dryRun}
            onChange={(e) => updateOptions({ dryRun: e.target.checked })}
            className="rounded"
          />
          Dry Run / Preview before process
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={options.onlyDeleteIfWhiteLike}
            onChange={(e) => updateOptions({ onlyDeleteIfWhiteLike: e.target.checked })}
            className="rounded"
          />
          Only delete if color is white/near white
        </label>
      </div>

      {options.onlyDeleteIfWhiteLike && (
        <div className="flex items-center gap-2 text-sm">
          <label className="text-muted-foreground">White tolerance:</label>
          <input
            type="number"
            min={0}
            max={50}
            value={options.whiteTolerance}
            onChange={(e) => updateOptions({ whiteTolerance: Number(e.target.value) })}
            className="w-16 px-2 py-1 rounded border border-border bg-background text-sm"
          />
          <span className="text-xs text-muted-foreground">(0-50)</span>
        </div>
      )}
    </div>
  );
}
