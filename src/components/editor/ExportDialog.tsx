"use client";

import { useSvgLayerStore } from "@/store/svgLayerStore";
import { ExportFormat, defaultExportSettings } from "@/types/svg";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileImage, FileCode, FileText, Loader2, AlertCircle } from "lucide-react";

type ExportDialogProps = {
  open: boolean;
  onClose: () => void;
};

const FORMAT_OPTIONS: {
  value: ExportFormat;
  label: string;
  description: string;
  icon: typeof FileImage;
}[] = [
  {
    value: "svg",
    label: "SVG",
    description: "Vector SVG file, best for further editing.",
    icon: FileCode,
  },
  {
    value: "png",
    label: "PNG Transparent",
    description: "Transparent background, suitable for icons, stickers, and microstock.",
    icon: FileImage,
  },
  {
    value: "jpg",
    label: "JPG",
    description: "White background, suitable for preview and sharing.",
    icon: FileImage,
  },
  {
    value: "eps",
    label: "EPS",
    description: "Vector EPS file for stock platforms and design software.",
    icon: FileText,
  },
];

const SCALE_OPTIONS = [
  { value: 1 as const, label: "1x", size: "2500x2500" },
  { value: 2 as const, label: "2x", size: "5000x5000" },
  { value: 4 as const, label: "4x", size: "10000x10000" },
];

const QUALITY_OPTIONS = [
  { value: 0.7, label: "70%" },
  { value: 0.8, label: "80%" },
  { value: 0.9, label: "90%" },
  { value: 1.0, label: "100%" },
];

export function ExportDialog({ open, onClose }: ExportDialogProps) {
  const exportSettings = useSvgLayerStore((s) => s.exportSettings);
  const setExportSettings = useSvgLayerStore((s) => s.setExportSettings);
  const exportCurrentSvg = useSvgLayerStore((s) => s.exportCurrentSvg);
  const isExporting = useSvgLayerStore((s) => s.isExporting);
  const exportError = useSvgLayerStore((s) => s.exportError);

  const { format, scale, jpgQuality, removeEditorData, keepLayerIds } = exportSettings;

  const handleExport = async () => {
    await exportCurrentSvg(format);
    // Only close on success (no error)
    const currentError = useSvgLayerStore.getState().exportError;
    if (!currentError) {
      onClose();
    }
  };

  const handleClose = () => {
    useSvgLayerStore.setState({ exportError: null });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Export File</DialogTitle>
          <DialogDescription className="text-sm">
            Export your cleaned 2500x2500 SVG artwork.
          </DialogDescription>
        </DialogHeader>

        {/* Format Cards */}
        <div className="grid grid-cols-2 gap-2">
          {FORMAT_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isActive = format === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setExportSettings({ format: opt.value })}
                className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-colors ${
                  isActive
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/30"
                }`}
              >
                <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                <div>
                  <div className="text-sm font-medium">{opt.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{opt.description}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* SVG Options */}
        {format === "svg" && (
          <div className="space-y-2 pt-2 border-t border-border">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={removeEditorData}
                onChange={(e) => setExportSettings({ removeEditorData: e.target.checked })}
                className="rounded"
              />
              Remove editor data (data-layer-id, etc.)
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={keepLayerIds}
                onChange={(e) => setExportSettings({ keepLayerIds: e.target.checked })}
                className="rounded"
              />
              Keep layer IDs
            </label>
          </div>
        )}

        {/* PNG / JPG Scale */}
        {(format === "png" || format === "jpg") && (
          <div className="space-y-3 pt-2 border-t border-border">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Scale</label>
              <div className="flex gap-1.5">
                {SCALE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setExportSettings({ scale: opt.value })}
                    className={`flex-1 px-3 py-2 rounded-md border text-center transition-colors ${
                      scale === opt.value
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:border-muted-foreground/30"
                    }`}
                  >
                    <div className="text-sm font-medium">{opt.label}</div>
                    <div className="text-[10px] text-muted-foreground">{opt.size}</div>
                  </button>
                ))}
              </div>
            </div>

            {format === "png" && (
              <div className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
                Transparent background enabled.
              </div>
            )}

            {format === "jpg" && (
              <>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Quality</label>
                  <div className="flex gap-1.5">
                    {QUALITY_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setExportSettings({ jpgQuality: opt.value })}
                        className={`flex-1 px-2 py-1.5 rounded-md border text-center text-sm transition-colors ${
                          jpgQuality === opt.value
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border hover:border-muted-foreground/30"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
                  White background will be applied automatically.
                </div>
              </>
            )}

            {scale === 4 && (
              <div className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 rounded-md px-3 py-2">
                Large export size may take longer and use more memory.
              </div>
            )}
          </div>
        )}

        {/* EPS Options */}
        {format === "eps" && (
          <div className="space-y-3 pt-2 border-t border-border">
            <div className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2 space-y-1">
              <p>
                EPS export uses strict-size mode (2500×2500 pt) with page bounds for stable sizing.
              </p>
              <p>
                Processed on the server using Inkscape CLI vector converter.
              </p>
              <p className="text-amber-600">
                Some SVG effects such as filters, transparency, or external images may not be fully supported in EPS.
              </p>
            </div>
          </div>
        )}

        {/* Error display */}
        {exportError && (
          <div className="flex items-start gap-2 text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2 border border-destructive/20">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{exportError}</span>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={handleClose} disabled={isExporting}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Exporting...
              </>
            ) : (
              `Export ${format.toUpperCase()}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
