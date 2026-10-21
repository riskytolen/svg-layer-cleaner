"use client";

import { useBatchAutomationStore } from "@/store/batchAutomationStore";
import { ExportFormat } from "@/lib/batch/batchTypes";
import { FileCode2, Image, FileImage, FileType, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const FORMATS: { value: ExportFormat; label: string; hint: string; icon: typeof Image; recommended?: boolean }[] = [
  { value: "svg", label: "SVG", hint: "Clean vector", icon: FileCode2 },
  { value: "png", label: "PNG", hint: "Transparent", icon: Image, recommended: true },
  { value: "jpg", label: "JPG", hint: "White fill", icon: FileImage },
  { value: "eps", label: "EPS", hint: "Print ready", icon: FileType },
];

export function ExportFormatSelector() {
  const exportFormats = useBatchAutomationStore((s) => s.options.exportFormats);
  const setExportFormats = useBatchAutomationStore((s) => s.setExportFormats);

  const toggle = (fmt: ExportFormat) => {
    if (exportFormats.includes(fmt)) {
      setExportFormats(exportFormats.filter((f) => f !== fmt));
    } else {
      setExportFormats([...exportFormats, fmt]);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.35)] h-full">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          Export Format
        </span>
        <span className="text-[10px] text-muted-foreground tabular-nums">
          {exportFormats.length} selected
        </span>
      </div>

      <div className="grid grid-cols-2 gap-1.5 mt-3">
        {FORMATS.map((fmt) => {
          const active = exportFormats.includes(fmt.value);
          const Icon = fmt.icon;
          return (
            <button
              key={fmt.value}
              onClick={() => toggle(fmt.value)}
              className={cn(
                "relative rounded-md border px-2.5 py-2 text-left transition-all cursor-pointer",
                active
                  ? "border-orange-500/60 bg-orange-500/10 shadow-[inset_0_0_0_1px_rgba(232,106,31,0.25)]"
                  : "border-border bg-background hover:border-[#4a4a54]",
              )}
            >
              <span className="flex items-center gap-2">
                <span
                  className={cn(
                    "w-7 h-7 rounded-md flex items-center justify-center shrink-0",
                    active ? "bg-orange-600 text-white" : "bg-muted text-muted-foreground",
                  )}
                >
                  <Icon className="w-3.5 h-3.5" strokeWidth={2} />
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5">
                    <span className={cn("block text-[12px] font-bold leading-none", active && "text-foreground")}>{fmt.label}</span>
                    {fmt.recommended && (
                      <span className="px-1 py-px rounded-sm bg-orange-600/90 text-white text-[8px] font-bold uppercase tracking-wide leading-none py-[2px]">
                        Pop
                      </span>
                    )}
                    {active && <CheckCircle2 className="w-3 h-3 text-orange-400 shrink-0" />}
                  </span>
                  <span className="block mt-1 text-[10px] text-muted-foreground leading-none whitespace-nowrap">{fmt.hint}</span>
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {exportFormats.length === 0 && (
        <p className="mt-2.5 text-[10.5px] text-amber-400">
          Select at least one format to continue.
        </p>
      )}
    </div>
  );
}
