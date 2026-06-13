"use client";

import { FileText, Layers, Hash, Palette, Move, Maximize } from "lucide-react";
import { useSvgLayerStore } from "@/store/svgLayerStore";

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <span className="w-3.5 h-3.5 text-muted-foreground shrink-0">{icon}</span>
      <span className="text-[11px] text-muted-foreground flex-1">{label}</span>
      <span className="text-[11px] font-medium text-right">{value}</span>
    </div>
  );
}

export function DocumentInfoPanel() {
  const documentInfo = useSvgLayerStore((s) => s.documentInfo);

  if (!documentInfo) return null;

  return (
    <div className="px-3 py-3">
      <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
        <FileText className="w-3 h-3" /> Document Info
      </h4>
      <div className="bg-muted rounded-lg p-2 space-y-0.5">
        <InfoRow
          icon={<FileText className="w-3.5 h-3.5" />}
          label="File"
          value={documentInfo.fileName}
        />
        <InfoRow
          icon={<Hash className="w-3.5 h-3.5" />}
          label="Size"
          value={formatBytes(documentInfo.fileSize)}
        />
        <InfoRow
          icon={<Maximize className="w-3.5 h-3.5" />}
          label="Width"
          value={documentInfo.width || "auto"}
        />
        <InfoRow
          icon={<Move className="w-3.5 h-3.5" />}
          label="Height"
          value={documentInfo.height || "auto"}
        />
        {documentInfo.viewBox && (
          <InfoRow
            icon={<Move className="w-3.5 h-3.5" />}
            label="ViewBox"
            value={
              <span className="font-mono text-[10px]">{documentInfo.viewBox}</span>
            }
          />
        )}
        <div className="border-t border-border my-1" />
        <InfoRow
          icon={<Layers className="w-3.5 h-3.5" />}
          label="Total Elements"
          value={documentInfo.totalElements}
        />
        <InfoRow
          icon={<Layers className="w-3.5 h-3.5" />}
          label="Groups"
          value={documentInfo.totalGroups}
        />
        <InfoRow
          icon={<Layers className="w-3.5 h-3.5" />}
          label="Paths"
          value={documentInfo.totalPaths}
        />
        <InfoRow
          icon={<Palette className="w-3.5 h-3.5" />}
          label="Unique Colors"
          value={documentInfo.totalColors}
        />
      </div>
    </div>
  );
}
