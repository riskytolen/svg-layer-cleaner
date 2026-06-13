"use client";

import { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  PenLine,
  Circle,
  Square,
  Type,
  Image,
  Hexagon,
  Minus,
  Triangle,
  Box,
  EyeOff,
  Shield,
  Layers,
  Paintbrush,
  Trash2,
  Lock,
} from "lucide-react";
import { SvgLayer, SvgElementType } from "@/types/svg";
import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/ui/badge";

const typeIcon: Record<SvgElementType, React.ReactNode> = {
  svg: <Layers className="w-3.5 h-3.5 text-primary" />,
  group: <Folder className="w-3.5 h-3.5 text-amber-500" />,
  path: <PenLine className="w-3.5 h-3.5 text-blue-500" />,
  circle: <Circle className="w-3.5 h-3.5 text-blue-500" />,
  rect: <Square className="w-3.5 h-3.5 text-blue-500" />,
  ellipse: <Circle className="w-3.5 h-3.5 text-blue-500" />,
  polygon: <Triangle className="w-3.5 h-3.5 text-blue-500" />,
  polyline: <Minus className="w-3.5 h-3.5 text-blue-500" />,
  line: <Minus className="w-3.5 h-3.5 text-blue-500" />,
  text: <Type className="w-3.5 h-3.5 text-green-500" />,
  image: <Image className="w-3.5 h-3.5 text-purple-500" />,
  defs: <Box className="w-3.5 h-3.5 text-gray-400" />,
  clipPath: <Shield className="w-3.5 h-3.5 text-gray-400" />,
  mask: <Shield className="w-3.5 h-3.5 text-gray-500" />,
  use: <Hexagon className="w-3.5 h-3.5 text-indigo-400" />,
  symbol: <Hexagon className="w-3.5 h-3.5 text-indigo-500" />,
  linearGradient: <Paintbrush className="w-3.5 h-3.5 text-pink-400" />,
  radialGradient: <Paintbrush className="w-3.5 h-3.5 text-pink-500" />,
  pattern: <Box className="w-3.5 h-3.5 text-gray-400" />,
  unknown: <Box className="w-3.5 h-3.5 text-gray-400" />,
};

interface LayerTreeItemProps {
  layer: SvgLayer;
  selectedId: string | null;
  selectedIds: string[];
  onSelect: (id: string) => void;
  onToggleSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onDeleteConfirm: (id: string, name: string, childCount: number) => void;
  depth?: number;
}

export function LayerTreeItem({
  layer,
  selectedId,
  selectedIds,
  onSelect,
  onToggleSelect,
  onDelete,
  onDeleteConfirm,
  depth = 0,
}: LayerTreeItemProps) {
  const [expanded, setExpanded] = useState(depth < 1);
  const isSelected = layer.id === selectedId;
  const isMultiSelected = selectedIds.includes(layer.id);
  const hasChildren = layer.children.length > 0;
  const isRoot = layer.type === "svg";
  const isLocked = layer.isLocked;
  const deleteDisabled = isRoot || isLocked;
  const colorIndicator = layer.fill || layer.stroke;

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (deleteDisabled) return;

    if (hasChildren) {
      onDeleteConfirm(layer.id, layer.name, layer.elementCount ?? layer.children.length);
    } else {
      onDelete(layer.id);
    }
  };

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-1 py-1 px-2 rounded-md cursor-pointer text-sm transition-colors group",
          "hover:bg-muted",
          isSelected && "bg-accent/10 ring-1 ring-accent",
          !isSelected && isMultiSelected && "bg-accent/5 ring-1 ring-accent/50",
        )}
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
        onClick={(e) => {
          if (e.shiftKey || e.metaKey || e.ctrlKey) {
            onToggleSelect(layer.id);
          } else {
            onSelect(layer.id);
          }
        }}
      >
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={isMultiSelected}
          onChange={() => onToggleSelect(layer.id)}
          onClick={(e) => e.stopPropagation()}
          className="w-3.5 h-3.5 rounded border-border shrink-0 cursor-pointer accent-primary opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ opacity: isMultiSelected ? 1 : undefined }}
        />

        {/* Expand/Collapse */}
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="p-0.5 hover:bg-muted rounded"
          >
            {expanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </button>
        ) : (
          <span className="w-4" />
        )}

        <span className="shrink-0">{typeIcon[layer.type]}</span>

        <span
          className={cn(
            "flex-1 truncate text-xs font-medium",
            isSelected && "text-accent",
            !layer.isVisible && "text-muted-foreground/60 italic",
          )}
        >
          {layer.name}
        </span>

        {!layer.isVisible && (
          <EyeOff className="w-3 h-3 text-muted-foreground/50" />
        )}

        {isLocked && (
          <Lock className="w-3 h-3 text-amber-500" />
        )}

        {colorIndicator && (
          <span
            className="w-3 h-3 rounded-full border border-border shrink-0"
            style={{ backgroundColor: colorIndicator }}
            title={colorIndicator}
          />
        )}

        <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
          {layer.tagName}
        </Badge>

        {layer.elementCount !== undefined && layer.elementCount > 0 && (
          <span className="text-[10px] text-muted-foreground">
            {layer.elementCount}
          </span>
        )}

        {/* Delete button */}
        {!deleteDisabled && (
          <button
            onClick={handleDeleteClick}
            className={cn(
              "p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity",
              "hover:bg-destructive/10 hover:text-destructive",
              deleteDisabled && "hidden",
            )}
            title={hasChildren ? "Delete group & children" : "Delete object"}
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>

      {hasChildren && expanded && (
        <div>
          {layer.children.map((child) => (
            <LayerTreeItem
              key={child.id}
              layer={child}
              selectedId={selectedId}
              selectedIds={selectedIds}
              onSelect={onSelect}
              onToggleSelect={onToggleSelect}
              onDelete={onDelete}
              onDeleteConfirm={onDeleteConfirm}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
