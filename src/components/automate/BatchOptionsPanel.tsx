"use client";

import { useBatchAutomationStore } from "@/store/batchAutomationStore";
import { WhiteBackgroundMode } from "@/lib/batch/batchTypes";
import {
  Eraser,
  Cpu,
  ShieldCheck,
  Maximize2,
  Sparkles,
  Droplets,
  Layers,
  FolderTree,
  HardDriveDownload,
  MousePointerClick,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

const MODE_OPTIONS: { value: WhiteBackgroundMode; label: string; hint: string }[] = [
  { value: "safe", label: "Safe", hint: "Conservative" },
  { value: "balanced", label: "Balanced", hint: "Recommended" },
  { value: "aggressive", label: "Aggressive", hint: "Maximum" },
];

function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative w-9 h-5 rounded-full transition-colors shrink-0 cursor-pointer",
        checked ? "bg-orange-600" : "bg-slate-300",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all",
          checked ? "left-[18px]" : "left-0.5",
        )}
      />
    </button>
  );
}

function OptionRow({
  icon: Icon,
  title,
  desc,
  checked,
  onChange,
}: {
  icon: typeof Cpu;
  title: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <span className="w-8 h-8 rounded-lg bg-muted text-muted-foreground flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4" strokeWidth={2} />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[13px] font-semibold leading-tight">{title}</span>
        <span className="block text-[11px] text-muted-foreground leading-tight mt-0.5">{desc}</span>
      </span>
      <Switch checked={checked} onChange={onChange} label={title} />
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  desc,
  accent,
}: {
  icon: typeof Cpu;
  title: string;
  desc: string;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className={cn("w-8 h-8 rounded-lg border flex items-center justify-center shrink-0", accent)}>
        <Icon className="w-4 h-4" strokeWidth={2} />
      </span>
      <span>
        <span className="block text-[11px] font-bold uppercase tracking-[0.14em] text-foreground">
          {title}
        </span>
        <span className="block text-[11px] text-muted-foreground">{desc}</span>
      </span>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  max,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  max: number;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold text-muted-foreground mb-1">{label}</span>
      <span className="flex items-center gap-1.5">
        <input
          type="number"
          min={0}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background text-[13px] font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
        />
        <span className="text-[10px] text-muted-foreground whitespace-nowrap">0–{max}</span>
      </span>
    </label>
  );
}

export function BatchOptionsPanel() {
  const options = useBatchAutomationStore((s) => s.options);
  const updateOptions = useBatchAutomationStore((s) => s.updateOptions);

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(16,24,40,0.05)] space-y-6 h-full">
      {/* Background removal */}
      <section className="space-y-3">
        <SectionHeader
          icon={Eraser}
          title="Background Removal"
          desc="Core white-background cleaning engine"
          accent="bg-orange-50 text-orange-600 border-orange-100"
        />
        <div className="rounded-xl bg-orange-50/50 border border-orange-100 px-3 divide-y divide-orange-100/70">
          <OptionRow
            icon={Eraser}
            title="Remove white background"
            desc="Detect and delete background layers"
            checked={options.removeWhiteBackground}
            onChange={(v) =>
              updateOptions({
                removeWhiteBackground: v,
                removeSameFillAsFirstPath: v,
              })
            }
          />
          <OptionRow
            icon={Droplets}
            title="Clean PNG residual / halo"
            desc="Edge flood-fill on transparent PNG"
            checked={options.cleanPngResidual}
            onChange={(v) => updateOptions({ cleanPngResidual: v })}
          />
        </div>

        {options.removeWhiteBackground && (
          <div className="space-y-3">
            <div>
              <span className="block text-[11px] font-semibold text-muted-foreground mb-1.5">
                Removal mode
              </span>
              <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-muted">
                {MODE_OPTIONS.map((m) => {
                  const active = options.backgroundMode === m.value;
                  return (
                    <button
                      key={m.value}
                      onClick={() => updateOptions({ backgroundMode: m.value })}
                      className={cn(
                        "rounded-lg px-2 py-1.5 text-center transition-all cursor-pointer",
                        active
                          ? "bg-card shadow-sm text-orange-700"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <span className="block text-xs font-bold">{m.label}</span>
                      <span className="block text-[10px] leading-tight">{m.hint}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <NumberField
                label="Color tolerance"
                value={options.backgroundColorTolerance}
                onChange={(v) => updateOptions({ backgroundColorTolerance: v })}
                max={100}
              />
              {options.cleanPngResidual && (
                <NumberField
                  label="PNG tolerance"
                  value={options.pngResidualTolerance}
                  onChange={(v) => updateOptions({ pngResidualTolerance: v })}
                  max={100}
                />
              )}
            </div>
          </div>
        )}
      </section>

      {/* Manual review */}
      <section className="space-y-2 pt-5 border-t border-border">
        <SectionHeader
          icon={MousePointerClick}
          title="Manual Review"
          desc="Click-to-clean leftovers per asset"
          accent="bg-violet-50 text-violet-600 border-violet-100"
        />
        <div className="rounded-xl bg-violet-50/50 border border-violet-100 px-3">
          <OptionRow
            icon={MousePointerClick}
            title="Review after auto clean"
            desc="Pause for manual cleanup before export"
            checked={options.manualReview}
            onChange={(v) => updateOptions({ manualReview: v })}
          />
        </div>
        {options.manualReview && (
          <div className="space-y-3">
            <div className="max-w-[220px]">
              <NumberField
                label="Same-color tolerance"
                value={options.reviewColorTolerance}
                onChange={(v) => updateOptions({ reviewColorTolerance: v })}
                max={50}
              />
            </div>
            <div>
              <span className="block text-[11px] font-semibold text-muted-foreground mb-1.5">
                Review canvas
              </span>
              <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-muted">
                {(["black", "checkerboard", "white"] as const).map((c) => {
                  const active = options.reviewCanvas === c;
                  return (
                    <button
                      key={c}
                      onClick={() => updateOptions({ reviewCanvas: c })}
                      className={cn(
                        "rounded-lg px-2 py-1.5 text-center transition-all cursor-pointer",
                        active
                          ? "bg-card shadow-sm text-orange-700"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <span className="block text-xs font-bold capitalize">{c}</span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                Black canvas makes leftover whites easy to spot. Export stays transparent.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Processing */}
      <section className="space-y-2 pt-5 border-t border-border">
        <SectionHeader
          icon={Cpu}
          title="Processing"
          desc="Resize, clean and scan behavior"
          accent="bg-blue-50 text-blue-600 border-blue-100"
        />
        <div className="divide-y divide-border/60">
          <OptionRow
            icon={Maximize2}
            title="Auto resize to 2500×2500"
            desc="Normalize canvas before export"
            checked={options.autoResize2500}
            onChange={(v) => updateOptions({ autoResize2500: v })}
          />
          <OptionRow
            icon={Sparkles}
            title="Quick Clean SVG"
            desc="Remove empty paths, groups and metadata"
            checked={options.quickClean}
            onChange={(v) => updateOptions({ quickClean: v })}
          />
          <OptionRow
            icon={Layers}
            title="Skip system layers"
            desc="Protect transform and locked layers"
            checked={options.skipSystemLayers}
            onChange={(v) => updateOptions({ skipSystemLayers: v })}
          />
          <OptionRow
            icon={FolderTree}
            title="Recursive scan"
            desc="Include SVG in subfolders"
            checked={options.recursive}
            onChange={(v) => updateOptions({ recursive: v })}
          />
          <OptionRow
            icon={HardDriveDownload}
            title="Overwrite existing files"
            desc="Replace outputs with the same name"
            checked={options.overwriteExisting}
            onChange={(v) => updateOptions({ overwriteExisting: v })}
          />
        </div>
      </section>

      {/* Safety */}
      <section className="space-y-2 pt-5 border-t border-border">
        <SectionHeader
          icon={ShieldCheck}
          title="Safety"
          desc="Preview and conservative guards"
          accent="bg-emerald-50 text-emerald-600 border-emerald-100"
        />
        <div className="divide-y divide-border/60">
          <OptionRow
            icon={ShieldCheck}
            title="Dry run preview"
            desc="Analyze without writing files"
            checked={options.dryRun}
            onChange={(v) => updateOptions({ dryRun: v })}
          />
          <OptionRow
            icon={Eraser}
            title="Only delete near-white"
            desc="Skip files without a white background"
            checked={options.onlyDeleteIfWhiteLike}
            onChange={(v) => updateOptions({ onlyDeleteIfWhiteLike: v })}
          />
        </div>
        {options.onlyDeleteIfWhiteLike && (
          <div className="max-w-[220px]">
            <NumberField
              label="White sensitivity"
              value={options.whiteTolerance}
              onChange={(v) => updateOptions({ whiteTolerance: v })}
              max={100}
            />
          </div>
        )}
      </section>
    </div>
  );
}
