"use client";

import { FolderPicker } from "./FolderPicker";
import { ExportFormatSelector } from "./ExportFormatSelector";
import { BatchOptionsPanel } from "./BatchOptionsPanel";
import { BatchProgressTable } from "./BatchProgressTable";
import { BatchSummary } from "./BatchSummary";
import { BatchLogPanel } from "./BatchLogPanel";
import { useBatchAutomationStore } from "@/store/batchAutomationStore";
import { Button } from "@/components/ui/button";
import { FolderOpen, Play, Pause, X, Trash2, Loader2 } from "lucide-react";

export function AutomatePanel() {
  const {
    options,
    files,
    totalFiles,
    isScanning,
    isRunning,
    isPaused,
    isCancelled,
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
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <FolderOpen className="w-5 h-5 text-orange-500" />
          <h1 className="text-lg font-semibold">Automate / Batch Processing</h1>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {isRunning && (
            <span className="flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              {currentFileIndex}/{totalFiles} - {currentFileName}
            </span>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Folder Selection */}
        <section className="grid grid-cols-2 gap-4">
          <FolderPicker type="input" />
          <FolderPicker type="output" />
        </section>

        {/* Format + Options */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1">
            <ExportFormatSelector />
          </div>
          <div className="lg:col-span-2">
            <BatchOptionsPanel />
          </div>
        </section>

        {/* Buttons */}
        <section className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={scanInputFolder}
            disabled={!options.inputFolderHandle || isRunning || isScanning}
          >
            {isScanning ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <FolderOpen className="w-3.5 h-3.5 mr-1.5" />
            )}
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
                Start Automate
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
            Clear Log
          </Button>
        </section>

        {/* Progress Table */}
        <BatchProgressTable />

        {/* Summary */}
        <BatchSummary />

        {/* Log */}
        <BatchLogPanel />
      </div>
    </div>
  );
}
