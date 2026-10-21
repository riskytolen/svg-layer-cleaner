"use client";

import { ModeCard } from "./ModeCard";
import { Layers, FolderCog, Upload, Paintbrush, Trash2, FileDown, FileSearch, Scan, Zap, BarChart3 } from "lucide-react";

const MANUAL_FEATURES = [
  "Single SVG upload",
  "Layer breakdown & tree",
  "Quick Clean SVG",
  "Select same fill color",
  "Delete objects",
  "Export SVG, PNG, JPG, EPS",
];

const AUTOMATE_FEATURES = [
  "Select input folder",
  "Select output folder",
  "Batch Quick Clean",
  "Auto remove first path fill color",
  "Export multiple formats",
  "Progress log & summary",
];

export function ModeSelectionDashboard() {
  return (
    <main className="min-h-screen flex flex-col workspace-canvas">
      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-12">
        <div className="text-center mb-10 max-w-xl">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center shadow-[0_2px_10px_rgba(0,0,0,0.45)]">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">SVG Layer Cleaner &amp; Exporter</h1>
          </div>
          <p className="text-muted-foreground text-base">
            Choose how you want to process your SVG files.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-[1000px] w-full">
          <ModeCard
            title="Manual Editor"
            description="Upload and edit a single SVG file. Inspect layers, clean paths, remove colors, and export manually."
            features={MANUAL_FEATURES}
            href="/manual"
            buttonLabel="Open Manual Editor"
            icon={<Layers className="w-6 h-6" />}
            accentColor="#E86A1F"
          />
          <ModeCard
            title="Automate Batch"
            description="Process multiple SVG files from a folder automatically using batch automation."
            features={AUTOMATE_FEATURES}
            href="/automate"
            buttonLabel="Open Automate Batch"
            icon={<FolderCog className="w-6 h-6" />}
            accentColor="#28B9D6"
          />
        </div>

        {/* Tips */}
        <div className="mt-9 text-center space-y-1">
          <p className="text-xs text-muted-foreground">
            Manual mode is best for checking and editing one SVG file.
          </p>
          <p className="text-xs text-muted-foreground">
            Automate mode is best for processing many SVG files at once.
          </p>
        </div>
      </section>
    </main>
  );
}
