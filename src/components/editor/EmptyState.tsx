import { Layers, Upload } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-5 text-center px-8">
      <div className="w-20 h-20 rounded-2xl border border-[#3d3d45] bg-[#232327] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] flex items-center justify-center">
        <Layers className="w-9 h-9 text-orange-400" strokeWidth={1.75} />
      </div>
      <div>
        <h2 className="text-lg font-bold text-foreground tracking-tight">
          Belum ada dokumen
        </h2>
        <p className="text-muted-foreground text-sm mt-1.5 max-w-sm">
          Buka file SVG untuk memeriksa struktur layer, membersihkan objek, dan mengekspor aset yang rapi.
        </p>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground border border-dashed border-[#3d3d45] rounded-lg px-3.5 py-2 bg-[#1d1d21]">
        <Upload className="w-3.5 h-3.5 text-muted-foreground" />
        Klik <span className="font-semibold text-foreground/80">Upload SVG</span> di toolbar, atau drag &amp; drop file ke area ini
      </div>
    </div>
  );
}
