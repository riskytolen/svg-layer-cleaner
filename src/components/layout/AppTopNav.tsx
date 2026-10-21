"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { Layers, FolderCog, MousePointer2 } from "lucide-react";

const NAV_ITEMS = [
  { href: "/manual", label: "Manual", icon: MousePointer2, match: "manual" as const },
  { href: "/automate", label: "Automate", icon: FolderCog, match: "automate" as const },
];

export function AppTopNav({ activeRoute }: { activeRoute: "manual" | "automate" }) {
  const pathname = usePathname();

  return (
    <header className="relative z-30 shrink-0 h-11 bg-[#1d1d21] border-b border-[#35353b]">
      <div className="h-full px-3 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2.5 shrink-0" title="Back to dashboard">
          <span className="w-7 h-7 rounded-md bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center shadow-[0_1px_4px_rgba(0,0,0,0.4)]">
            <Layers className="w-3.5 h-3.5 text-white" strokeWidth={2.25} />
          </span>
          <span className="hidden sm:flex flex-col leading-none">
            <span className="text-[12.5px] font-bold tracking-tight text-foreground">SVG EDITOR</span>
            <span className="block mt-0.5 text-[9px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Background Remover Studio
            </span>
          </span>
        </Link>

        <nav className="flex items-center gap-1 border-l border-border pl-4 h-6">
          {NAV_ITEMS.map((item) => {
            const isActive =
              activeRoute === item.match ||
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 px-3 h-7 rounded-md text-[12px] font-semibold transition-colors",
                  isActive
                    ? "bg-[#33333a] text-foreground shadow-[inset_0_0_0_1px_#45454e]"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted",
                )}
              >
                <Icon className="w-3.5 h-3.5" strokeWidth={2.25} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/25 text-[10.5px] font-semibold text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            {activeRoute === "automate" ? "Batch Engine Ready" : "Editor Ready"}
          </span>
        </div>
      </div>
    </header>
  );
}
