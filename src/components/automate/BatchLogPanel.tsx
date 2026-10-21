"use client";

import { useBatchAutomationStore } from "@/store/batchAutomationStore";
import { useRef, useEffect, useState } from "react";
import { ChevronDown, Copy, Trash2, Terminal, Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const LEVEL_COLORS: Record<string, string> = {
  info: "text-slate-400",
  process: "text-blue-400",
  color: "text-purple-400",
  delete: "text-orange-400",
  export: "text-cyan-400",
  success: "text-emerald-400",
  warning: "text-amber-400",
  error: "text-red-400",
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
    <section className="rounded-lg border border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.35)] overflow-hidden">
      <button
        onClick={toggleLogExpanded}
        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-muted/50 transition-colors cursor-pointer"
      >
        <span className="w-7 h-7 rounded-md bg-elevated border border-border text-orange-400 flex items-center justify-center shrink-0">
          <Terminal className="w-3.5 h-3.5" strokeWidth={2} />
        </span>
        <span className="text-left">
          <span className="block text-[12px] font-bold tracking-tight leading-tight">Processing Log</span>
          <span className="block text-[10.5px] text-muted-foreground tabular-nums">
            {logs.length} entries
            {errorCount > 0 && ` · ${errorCount} error${errorCount > 1 ? "s" : ""}`}
          </span>
        </span>
        {errorCount > 0 && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/10 border border-red-500/25 text-red-400 tabular-nums">
            {errorCount} errors
          </span>
        )}
        <span className="ml-auto flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <span
            role="button"
            tabIndex={0}
            onClick={copyLog}
            onKeyDown={(e) => e.key === "Enter" && copyLog()}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied" : "Copy"}
          </span>
          <span
            role="button"
            tabIndex={0}
            onClick={clearLogs}
            onKeyDown={(e) => e.key === "Enter" && clearLogs()}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-semibold text-muted-foreground hover:bg-red-500/10 hover:text-red-400 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </span>
        </span>
        <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform shrink-0", isLogExpanded && "rotate-180")} />
      </button>

      {isLogExpanded && (
        <div className="border-t border-border px-3 pb-3 pt-2.5 bg-[#161619]">
          <div
            ref={scrollRef}
            className="max-h-[300px] overflow-auto bg-[#0e0e10] border border-[#2a2a30] rounded-md p-3 font-mono text-[11px] leading-relaxed"
          >
            {logs.map((log, i) => (
              <div key={i} className={cn("whitespace-pre-wrap break-all", LEVEL_COLORS[log.level] || "text-slate-400")}>
                <span className="text-zinc-600 tabular-nums">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>{" "}
                <span className="font-bold">{LEVEL_PREFIX[log.level] || "[LOG]"}</span>{" "}
                {log.message}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
