"use client";

import { useBatchAutomationStore } from "@/store/batchAutomationStore";
import { ExportFormat } from "@/lib/batch/batchTypes";

const FORMATS: { value: ExportFormat; label: string }[] = [
  { value: "svg", label: "SVG" },
  { value: "png", label: "PNG Transparent" },
  { value: "jpg", label: "JPG" },
  { value: "eps", label: "EPS" },
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
    <div className="p-3 rounded-lg border border-border bg-card space-y-2">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Export Format
      </div>
      <div className="flex flex-wrap gap-2">
        {FORMATS.map((fmt) => (
          <label
            key={fmt.value}
            className="flex items-center gap-1.5 text-sm cursor-pointer"
          >
            <input
              type="checkbox"
              checked={exportFormats.includes(fmt.value)}
              onChange={() => toggle(fmt.value)}
              className="rounded"
            />
            {fmt.label}
          </label>
        ))}
      </div>
    </div>
  );
}
