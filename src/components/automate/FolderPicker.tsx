"use client";

import { useBatchAutomationStore } from "@/store/batchAutomationStore";
import { Button } from "@/components/ui/button";
import { FolderOpen, CheckCircle } from "lucide-react";

type FolderPickerProps = {
  type: "input" | "output";
};

export function FolderPicker({ type }: FolderPickerProps) {
  const selectInputFolder = useBatchAutomationStore((s) => s.selectInputFolder);
  const selectOutputFolder = useBatchAutomationStore((s) => s.selectOutputFolder);
  const inputHandle = useBatchAutomationStore((s) => s.options.inputFolderHandle);
  const outputHandle = useBatchAutomationStore((s) => s.options.outputFolderHandle);

  const handle = type === "input" ? inputHandle : outputHandle;
  const setHandle = type === "input" ? selectInputFolder : selectOutputFolder;
  const label = type === "input" ? "Input Folder" : "Output Folder";

  const pickFolder = async () => {
    if (!("showDirectoryPicker" in window)) {
      alert("Folder automation requires a desktop browser that supports folder access.");
      return;
    }
    try {
      const dirHandle = await (window as any).showDirectoryPicker({ mode: "readwrite" });
      setHandle(dirHandle);
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        alert(`Failed to select folder: ${err.message}`);
      }
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
      <Button variant="outline" size="sm" onClick={pickFolder}>
        <FolderOpen className="w-3.5 h-3.5 mr-1.5" />
        {label}
      </Button>
      {handle ? (
        <span className="flex items-center gap-1.5 text-xs text-green-600">
          <CheckCircle className="w-3 h-3" />
          {handle.name}
        </span>
      ) : (
        <span className="text-xs text-muted-foreground">No folder selected</span>
      )}
    </div>
  );
}
