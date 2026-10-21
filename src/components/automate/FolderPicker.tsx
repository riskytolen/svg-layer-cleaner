"use client";

import { useBatchAutomationStore } from "@/store/batchAutomationStore";
import { Button } from "@/components/ui/button";
import { FolderOpen, FolderInput, FolderOutput, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type FolderPickerProps = {
  type: "input" | "output";
};

const META = {
  input: {
    step: "Step 1",
    label: "Input Folder",
    description: "Source folder containing SVG files",
    icon: FolderInput,
    iconBox: "text-blue-400 border-blue-500/30 bg-blue-500/10",
  },
  output: {
    step: "Step 2",
    label: "Output Folder",
    description: "Destination for cleaned assets",
    icon: FolderOutput,
    iconBox: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  },
} as const;

export function FolderPicker({ type }: FolderPickerProps) {
  const selectInputFolder = useBatchAutomationStore((s) => s.selectInputFolder);
  const selectOutputFolder = useBatchAutomationStore((s) => s.selectOutputFolder);
  const inputHandle = useBatchAutomationStore((s) => s.options.inputFolderHandle);
  const outputHandle = useBatchAutomationStore((s) => s.options.outputFolderHandle);

  const handle = type === "input" ? inputHandle : outputHandle;
  const setHandle = type === "input" ? selectInputFolder : selectOutputFolder;
  const meta = META[type];
  const Icon = meta.icon;

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
    <div className="rounded-lg border border-border bg-card p-3 shadow-[0_1px_2px_rgba(0,0,0,0.35)]">
      <div className="flex items-center gap-3">
        <span className={cn("w-8 h-8 rounded-md border flex items-center justify-center shrink-0 bg-background", meta.iconBox)}>
          <Icon className="w-4 h-4" strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{meta.step}</span>
            <span className="text-[13px] font-bold tracking-tight">{meta.label}</span>
            {handle ? (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/25 text-[10px] font-semibold text-emerald-400 shrink-0">
                <CheckCircle2 className="w-3 h-3" />
                Selected
              </span>
            ) : (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/25 text-[10px] font-semibold text-amber-400 shrink-0">
                <AlertCircle className="w-3 h-3" />
                Required
              </span>
            )}
          </div>
          <div className="text-[11px] text-muted-foreground truncate">{meta.description}</div>
        </div>
      </div>

      <div className="mt-2.5 flex items-center gap-2 rounded-md bg-background border border-border/70 pl-2.5 pr-1.5 py-1.5">
        <FolderOpen className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        {handle ? (
          <span className="font-mono text-xs truncate text-foreground/85" title={handle.name}>
            {handle.name}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">No folder selected yet</span>
        )}
        <Button variant="outline" size="sm" onClick={pickFolder} className="ml-auto shrink-0 rounded-md font-semibold h-6.5 px-2.5 text-xs">
          Choose
        </Button>
      </div>
    </div>
  );
}
