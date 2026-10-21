"use client";

import { Sparkles, AlertTriangle, RotateCcw } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useSvgLayerStore } from "@/store/svgLayerStore";
import { CleanSvgOptions } from "@/types/svg";

function Checkbox({
  label,
  description,
  checked,
  onChange,
  disabled,
  warning,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  warning?: boolean;
}) {
  return (
    <label className="flex items-start gap-2 py-1.5 cursor-pointer group">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="mt-0.5 w-3.5 h-3.5 rounded border-border shrink-0 cursor-pointer accent-primary disabled:opacity-50"
      />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium group-hover:text-foreground transition-colors">
          {label}
        </p>
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
      {warning && (
        <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
      )}
    </label>
  );
}

export function CleanSvgPanel() {
  const cleanOptions = useSvgLayerStore((s) => s.cleanOptions);
  const setCleanOptions = useSvgLayerStore((s) => s.setCleanOptions);
  const resetCleanOptions = useSvgLayerStore((s) => s.resetCleanOptions);
  const cleanSvg = useSvgLayerStore((s) => s.cleanSvg);
  const svgText = useSvgLayerStore((s) => s.svgText);

  const handleToggle = (key: keyof CleanSvgOptions) => (value: boolean) => {
    setCleanOptions({ [key]: value });
  };

  return (
    <ScrollArea className="h-full px-3 py-3">
      <div className="space-y-3">
        <div>
          <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Clean SVG
          </h4>
          <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
            Remove unused paths, empty groups, comments, metadata, and unnecessary SVG elements.
          </p>
        </div>

        <div className="border-t border-border" />

        <div className="space-y-0.5">
          <Checkbox
            label="Remove empty paths"
            description='<path d="" /> or <path d=" " />'
            checked={cleanOptions.removeEmptyPaths}
            onChange={handleToggle("removeEmptyPaths")}
          />
          <Checkbox
            label="Remove paths without d attribute"
            description="Path elements missing the d attribute"
            checked={cleanOptions.removePathsWithoutD}
            onChange={handleToggle("removePathsWithoutD")}
          />
          <Checkbox
            label="Remove empty groups"
            description="Groups with no visible children"
            checked={cleanOptions.removeEmptyGroups}
            onChange={handleToggle("removeEmptyGroups")}
          />
          <Checkbox
            label="Remove comments"
            description="HTML comments <!-- ... -->"
            checked={cleanOptions.removeComments}
            onChange={handleToggle("removeComments")}
          />
          <Checkbox
            label="Remove metadata"
            description="Metadata, title, and desc elements"
            checked={cleanOptions.removeMetadata}
            onChange={handleToggle("removeMetadata")}
          />
          <Checkbox
            label="Remove hidden elements"
            description="display:none, visibility:hidden, opacity:0"
            checked={cleanOptions.removeHiddenElements}
            onChange={handleToggle("removeHiddenElements")}
            warning
          />
          <Checkbox
            label="Remove elements without fill/stroke"
            description="Visual elements with no visible color"
            checked={cleanOptions.removeElementsWithoutFillAndStroke}
            onChange={handleToggle("removeElementsWithoutFillAndStroke")}
            warning
          />
          <Checkbox
            label="Remove empty defs"
            description="Empty defs containers"
            checked={cleanOptions.removeEmptyDefs}
            onChange={handleToggle("removeEmptyDefs")}
          />
          <Checkbox
            label="Remove editor attributes"
            description="Inkscape, Sketch, Serif, etc."
            checked={cleanOptions.removeEditorAttributes}
            onChange={handleToggle("removeEditorAttributes")}
            warning
          />
          <Checkbox
            label="Optimize whitespace"
            description="Collapse extra whitespace between tags"
            checked={cleanOptions.optimizeWhitespace}
            onChange={handleToggle("optimizeWhitespace")}
          />
        </div>

        <div className="border-t border-border" />

        <div className="flex gap-1.5">
          <Button
            variant="default"
            size="sm"
            className="flex-1 h-8"
            disabled={!svgText}
            onClick={cleanSvg}
          >
            <Sparkles className="w-3.5 h-3.5 mr-1" />
            Clean SVG
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={resetCleanOptions}
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            Reset
          </Button>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/25 rounded-md p-2">
          <p className="text-[10px] text-amber-700 leading-relaxed flex items-start gap-1">
            <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
            Be careful when removing elements without fill/stroke because some SVG files use inherited styles.
          </p>
        </div>
      </div>
    </ScrollArea>
  );
}
