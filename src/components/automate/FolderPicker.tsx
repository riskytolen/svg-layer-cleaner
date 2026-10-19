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
    iconBox: "bg-blue-50 text-blue-600 border-blue-100",
  },
  output: {
    step: "Step 2",
    label: "Output Folder",
    description: "Destination for cleaned assets",
    icon: FolderOutput,
    iconBox: "bg-emerald-50 text-emerald-600 border-emerald-100",
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
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={cn("w-10 h-10 rounded-xl border flex items-center justify-center shrink-0", meta.iconBox)}>
            <Icon className="w-5 h-5" strokeWidth={2} />
          </span>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              {meta.step}
            </div>
            <div className="text-sm font-semibold tracking-tight">{meta.label}</div>
            <div className="text-xs text-muted-foreground">{meta.description}</div>
          </div>
        </div>
        {handle ? (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-700 shrink-0">
            <CheckCircle2 className="w-3 h-3" />
            Selected
          </span>
        ) : (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[11px] font-semibold text-amber-700 shrink-0">
            <AlertCircle className="w-3 h-3" />
            Required
          </span>
        )}
      </div>

      <div className="mt-4 flex items-center gap-3 rounded-xl bg-muted/60 border border-border/60 pl-3.5 pr-2 py-2">
        <FolderOpen className="w-4 h-4 text-muted-foreground shrink-0" />
        {handle ? (
          <span className="text-[13px] font-medium truncate" title={handle.name}>
            {handle.name}
          </span>
        ) : (
          <span className="text-[13px] text-muted-foreground">No folder selected yet</span>
        )}
        <Button variant="outline" size="sm" onClick={pickFolder} className="ml-auto shrink-0 rounded-lg font-semibold">
          Choose
        </Button>
      </div>
    </div>
  );
}
