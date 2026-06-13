import { Layers } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
      <div className="w-20 h-20 rounded-2xl bg-orange-50 flex items-center justify-center">
        <Layers className="w-10 h-10 text-primary" />
      </div>
      <h2 className="text-xl font-semibold text-foreground">
        SVG Layer Cleaner
      </h2>
      <p className="text-muted-foreground max-w-sm text-sm">
        Upload file SVG untuk melihat daftar layer, object, dan elemen di dalamnya. Anda bisa membersihkan, memilih, dan mengekspor SVG dengan mudah.
      </p>
      <p className="text-xs text-muted-foreground mt-4">
        Klik tombol Upload SVG di pojok kanan atas atau drag and drop file SVG ke halaman ini
      </p>
    </div>
  );
}
