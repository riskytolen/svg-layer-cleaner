"use client";

import { useSvgLayerStore } from "@/store/svgLayerStore";
import { Button } from "@/components/ui/button";
import { BackgroundMode } from "@/types/svg";

export function BackgroundSettingsPanel() {
  const backgroundMode = useSvgLayerStore((s) => s.backgroundMode);
  const setBackgroundMode = useSvgLayerStore((s) => s.setBackgroundMode);

  const options: { value: BackgroundMode; label: string; desc: string }[] = [
    { value: "white", label: "White Background", desc: "Standard solid white canvas." },
    { value: "transparent", label: "Transparent", desc: "No background fill. Good for PNG export." },
  ];

  return (
    <div className="space-y-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Background
      </div>
      <div className="flex flex-col gap-2">
        {options.map((opt) => (
          <Button
            key={opt.value}
            variant={backgroundMode === opt.value ? "default" : "outline"}
            size="sm"
            className={`justify-start text-xs ${
              backgroundMode === opt.value
                ? "bg-orange-600 text-white hover:bg-orange-700"
                : "text-slate-700"
            }`}
            onClick={() => setBackgroundMode(opt.value)}
          >
            {opt.label}
          </Button>
        ))}
      </div>
      <p className="text-[10px] text-slate-400 leading-snug">
        White background is locked and cannot be deleted or selected.
      </p>
    </div>
  );
}
