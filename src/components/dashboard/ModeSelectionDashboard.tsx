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
    <main className="min-h-screen flex flex-col" style={{ backgroundColor: "#F5F6F8" }}>
      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 pt-20 pb-12">
        <div className="text-center mb-12 max-w-xl">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold">SVG Layer Cleaner & Exporter</h1>
          </div>
          <p className="text-muted-foreground text-base">
            Choose how you want to process your SVG files.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-[1000px] w-full">
          <ModeCard
            title="Manual Editor"
            description="Upload and edit a single SVG file. Inspect layers, clean paths, remove colors, and export manually."
            features={MANUAL_FEATURES}
            href="/manual"
            buttonLabel="Open Manual Editor"
            icon={<Layers className="w-6 h-6" />}
            accentColor="#D35400"
          />
          <ModeCard
            title="Automate Batch"
            description="Process multiple SVG files from a folder automatically using batch automation."
            features={AUTOMATE_FEATURES}
            href="/automate"
            buttonLabel="Open Automate Batch"
            icon={<FolderCog className="w-6 h-6" />}
            accentColor="#06B6D4"
          />
        </div>

        {/* Tips */}
        <div className="mt-10 text-center space-y-1">
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
