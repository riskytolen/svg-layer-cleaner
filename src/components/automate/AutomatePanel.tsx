"use client";

import { FolderPicker } from "./FolderPicker";
import { ExportFormatSelector } from "./ExportFormatSelector";
import { BatchOptionsPanel } from "./BatchOptionsPanel";
import { BatchProgressTable } from "./BatchProgressTable";
import { BatchSummary } from "./BatchSummary";
import { BatchLogPanel } from "./BatchLogPanel";
import { useBatchAutomationStore } from "@/store/batchAutomationStore";
import { Button } from "@/components/ui/button";
import { Play, Pause, X, Trash2, Loader2 } from "lucide-react";

export function AutomatePanel() {
  const {
    options,
    files,
    totalFiles,
    isScanning,
    isRunning,
    isPaused,
    currentFileIndex,
    currentFileName,
    scanInputFolder,
    startDryRun,
    startBatchProcess,
    pauseBatch,
    resumeBatch,
    cancelBatch,
    clearResults,
  } = useBatchAutomationStore();

  const isFolderPicked = !!options.inputFolderHandle && !!options.outputFolderHandle;

  return (
    <div className="flex-1 overflow-auto p-6 space-y-4">
      {/* Title */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Batch Automation</h1>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {isRunning && (
            <span className="flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              {currentFileIndex}/{totalFiles} — {currentFileName}
            </span>
          )}
        </div>
      </div>

      {/* Folder Selection */}
      <section className="grid grid-cols-2 gap-3">
        <FolderPicker type="input" />
        <FolderPicker type="output" />
      </section>

      {/* Format + Options + Buttons */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-1">
          <ExportFormatSelector />
        </div>
        <div className="lg:col-span-1">
          <BatchOptionsPanel />
        </div>
        <div className="lg:col-span-1 flex flex-col justify-end">
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={scanInputFolder}
              disabled={!options.inputFolderHandle || isRunning || isScanning}
            >
              {isScanning ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : null}
              Scan Folder
            </Button>

            {!isRunning ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startDryRun}
                  disabled={!isFolderPicked || files.length === 0}
                >
                  Dry Run
                </Button>
                <Button
                  size="sm"
                  onClick={startBatchProcess}
                  disabled={!isFolderPicked || files.length === 0}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  <Play className="w-3.5 h-3.5 mr-1.5" />
                  Start
                </Button>
              </>
            ) : (
              <>
                {!isPaused ? (
                  <Button variant="outline" size="sm" onClick={pauseBatch}>
                    <Pause className="w-3.5 h-3.5 mr-1.5" />
                    Pause
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={resumeBatch}>
                    <Play className="w-3.5 h-3.5 mr-1.5" />
                    Resume
                  </Button>
                )}
                <Button variant="destructive" size="sm" onClick={cancelBatch}>
                  <X className="w-3.5 h-3.5 mr-1.5" />
                  Cancel
                </Button>
              </>
            )}

            <Button variant="ghost" size="sm" onClick={clearResults} className="ml-auto">
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              Clear
            </Button>
          </div>
        </div>
      </section>

      {/* Summary */}
      <BatchSummary />

      {/* Result Table */}
      <BatchProgressTable />

      {/* Log */}
      <BatchLogPanel />
    </div>
  );
}
