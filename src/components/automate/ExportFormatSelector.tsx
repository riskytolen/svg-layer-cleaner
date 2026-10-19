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
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(16,24,40,0.05)] h-full">
      <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        Export Format
      </div>
      <p className="text-xs text-muted-foreground mt-1">Choose output asset types</p>

      <div className="grid grid-cols-2 gap-2.5 mt-4">
        {FORMATS.map((fmt) => {
          const active = exportFormats.includes(fmt.value);
          const Icon = fmt.icon;
          return (
            <button
              key={fmt.value}
              onClick={() => toggle(fmt.value)}
              className={cn(
                "relative rounded-xl border p-3 text-left transition-all cursor-pointer",
                active
                  ? "border-orange-500 bg-orange-50/60 shadow-[0_2px_8px_rgba(211,84,0,0.12)]"
                  : "border-border bg-background hover:border-slate-300 hover:shadow-sm",
              )}
            >
              {fmt.recommended && (
                <span className="absolute -top-2 left-2.5 px-1.5 py-px rounded-full bg-orange-600 text-white text-[9px] font-bold uppercase tracking-wider">
                  Popular
                </span>
              )}
              <span className="flex items-center justify-between">
                <span
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    active ? "bg-orange-600 text-white" : "bg-muted text-muted-foreground",
                  )}
                >
                  <Icon className="w-4 h-4" strokeWidth={2} />
                </span>
                {active && <CheckCircle2 className="w-4 h-4 text-orange-600" />}
              </span>
              <span className="block mt-2 text-[13px] font-bold leading-none">{fmt.label}</span>
              <span className="block mt-1 text-[11px] text-muted-foreground leading-none">{fmt.hint}</span>
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-[11px] text-muted-foreground">
        {exportFormats.length === 0
          ? "Select at least one format to continue."
          : `${exportFormats.length} format${exportFormats.length > 1 ? "s" : ""} selected`}
      </p>
    </div>
  );
}
