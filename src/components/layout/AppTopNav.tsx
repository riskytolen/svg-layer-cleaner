"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { Layers, FolderCog } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", active: false },
  { href: "/manual", label: "Manual Editor", icon: Layers },
  { href: "/automate", label: "Automate Batch", icon: FolderCog },
];

export function AppTopNav({ activeRoute }: { activeRoute: "manual" | "automate" }) {
  const pathname = usePathname();

  return (
    <header className="h-14 border-b border-border bg-card flex items-center px-6 shrink-0">
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2 font-semibold text-sm">
          <Layers className="w-5 h-5 text-orange-500" />
          SVG Layer Cleaner
        </Link>

        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm transition-colors",
                  isActive
                    ? "bg-orange-50 text-orange-700 font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
