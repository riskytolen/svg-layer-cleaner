"use client";

import { useBatchAutomationStore } from "@/store/batchAutomationStore";
import { useRef, useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Copy, Trash2 } from "lucide-react";

const LEVEL_COLORS: Record<string, string> = {
  info: "text-slate-500",
  process: "text-blue-600",
  color: "text-purple-600",
  delete: "text-orange-600",
  export: "text-cyan-600",
  success: "text-green-600",
  warning: "text-amber-600",
  error: "text-red-600",
};

const LEVEL_PREFIX: Record<string, string> = {
  info: "[INFO]",
  process: "[PROCESS]",
  color: "[COLOR]",
  delete: "[DELETE]",
  export: "[EXPORT]",
  success: "[SUCCESS]",
  warning: "[WARN]",
  error: "[ERROR]",
};

export function BatchLogPanel() {
  const logs = useBatchAutomationStore((s) => s.logs);
  const isLogExpanded = useBatchAutomationStore((s) => s.isLogExpanded);
  const toggleLogExpanded = useBatchAutomationStore((s) => s.toggleLogExpanded);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isLogExpanded && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, isLogExpanded]);

  if (logs.length === 0) return null;

  const copyLog = async () => {
    const text = logs.map((l) => {
      const time = new Date(l.timestamp).toLocaleTimeString();
      return `${time} ${LEVEL_PREFIX[l.level] || "[LOG]"} ${l.message}`;
    }).join("\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clearLogs = () => {
    useBatchAutomationStore.setState({ logs: [] });
  };

  const errorCount = logs.filter((l) => l.level === "error").length;

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Header */}
      <button
        onClick={toggleLogExpanded}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Processing Log
          </span>
          <span className="text-[10px] text-muted-foreground">({logs.length})</span>
          {errorCount > 0 && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-700">
              {errorCount} errors
            </span>
          )}
        </div>
        {isLogExpanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {/* Content */}
      {isLogExpanded && (
        <div className="border-t border-border">
          <div className="flex items-center gap-1 px-3 py-1.5 border-b border-border bg-slate-50">
            <button
              onClick={copyLog}
              className="flex items-center gap-1 px-2 py-1 rounded text-[10px] text-muted-foreground hover:bg-muted transition-colors"
            >
              <Copy className="w-3 h-3" />
              {copied ? "Copied!" : "Copy Log"}
            </button>
            <button
              onClick={clearLogs}
              className="flex items-center gap-1 px-2 py-1 rounded text-[10px] text-muted-foreground hover:bg-muted transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Clear
            </button>
          </div>
          <div
            ref={scrollRef}
            className="max-h-[300px] overflow-auto bg-slate-950 p-3 font-mono text-[11px] leading-relaxed"
          >
            {logs.map((log, i) => (
              <div key={i} className={LEVEL_COLORS[log.level] || "text-slate-400"}>
                <span className="text-slate-600">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>{" "}
                <span className="font-bold">{LEVEL_PREFIX[log.level] || "[LOG]"}</span>{" "}
                {log.message}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
