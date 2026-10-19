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
    <section className="rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(16,24,40,0.05)] overflow-hidden">
      <button
        onClick={toggleLogExpanded}
        className="w-full flex items-center gap-2.5 px-5 py-3.5 hover:bg-muted/50 transition-colors cursor-pointer"
      >
        <span className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
          <Terminal className="w-4 h-4" strokeWidth={2} />
        </span>
        <span className="text-left">
          <span className="block text-sm font-bold tracking-tight leading-tight">Processing Log</span>
          <span className="block text-[11px] text-muted-foreground tabular-nums">
            {logs.length} entries
            {errorCount > 0 && ` · ${errorCount} errors`}
          </span>
        </span>
        {errorCount > 0 && (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-50 border border-red-200 text-red-700">
            {errorCount} errors
          </span>
        )}
        <span className="ml-auto flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <span
            role="button"
            tabIndex={0}
            onClick={copyLog}
            onKeyDown={(e) => e.key === "Enter" && copyLog()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied" : "Copy"}
          </span>
          <span
            role="button"
            tabIndex={0}
            onClick={clearLogs}
            onKeyDown={(e) => e.key === "Enter" && clearLogs()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </span>
        </span>
        <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform shrink-0", isLogExpanded && "rotate-180")} />
      </button>

      {isLogExpanded && (
        <div className="border-t border-border px-4 pb-4 pt-3 bg-muted/40">
          <div
            ref={scrollRef}
            className="max-h-[300px] overflow-auto bg-slate-950 rounded-xl p-4 font-mono text-[11px] leading-relaxed shadow-inner"
          >
            {logs.map((log, i) => (
              <div key={i} className={cn("whitespace-pre-wrap break-all", LEVEL_COLORS[log.level] || "text-slate-400")}>
                <span className="text-slate-600 tabular-nums">
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
