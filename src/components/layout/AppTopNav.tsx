"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { Layers, FolderCog } from "lucide-react";

const NAV_ITEMS = [
  { href: "/automate", label: "Automate Batch", icon: FolderCog },
];

export function AppTopNav({ activeRoute }: { activeRoute: "manual" | "automate" }) {
  const pathname = usePathname();

  return (
    <header className="h-16 border-b border-border bg-card/95 backdrop-blur shrink-0 shadow-[0_1px_3px_rgba(16,24,40,0.06)] relative z-20">
      <div className="mx-auto max-w-[1400px] h-full px-6 flex items-center gap-8">
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center shadow-[0_2px_8px_rgba(211,84,0,0.35)]">
            <Layers className="w-4.5 h-4.5 text-white" strokeWidth={2.25} />
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-bold tracking-tight">SVG Layer Cleaner</span>
            <span className="block text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Background Remover Studio
            </span>
          </span>
        </Link>

        <nav className="flex items-center gap-1.5">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-2 rounded-full text-[13px] font-medium transition-all",
                  isActive
                    ? "bg-orange-600 text-white shadow-[0_2px_8px_rgba(211,84,0,0.35)]"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted",
                )}
              >
                <Icon className="w-3.5 h-3.5" strokeWidth={2.25} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto hidden md:flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {activeRoute === "automate" ? "Batch Engine Ready" : "Editor Ready"}
          </span>
        </div>
      </div>
    </header>
  );
}
