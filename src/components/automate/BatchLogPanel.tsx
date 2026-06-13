"use client";

import { useBatchAutomationStore } from "@/store/batchAutomationStore";
import { useRef, useEffect } from "react";

const LEVEL_COLORS: Record<string, string> = {
  info: "text-slate-600",
  process: "text-blue-600",
  color: "text-purple-600",
  delete: "text-orange-600",
  export: "text-cyan-600",
  success: "text-green-600",
  warning: "text-yellow-600",
  error: "text-red-600",
};

const LEVEL_PREFIX: Record<string, string> = {
  info: "[INFO]",
  process: "[PROCESS]",
  color: "[COLOR]",
  delete: "[DELETE]",
  export: "[EXPORT]",
  success: "[SUCCESS]",
  warning: "[WARNING]",
  error: "[ERROR]",
};

export function BatchLogPanel() {
  const logs = useBatchAutomationStore((s) => s.logs);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  if (logs.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Log
      </div>
      <div
        ref={scrollRef}
        className="h-48 overflow-auto border border-border rounded-lg bg-slate-950 p-3 font-mono text-[11px] leading-relaxed"
      >
        {logs.map((log, i) => (
          <div key={i} className={`${LEVEL_COLORS[log.level] || "text-slate-400"}`}>
            <span className="text-slate-500">
              {new Date(log.timestamp).toLocaleTimeString()}
            </span>{" "}
            <span className="font-bold">{LEVEL_PREFIX[log.level] || "[LOG]"}</span>{" "}
            {log.message}
          </div>
        ))}
      </div>
    </div>
  );
}
