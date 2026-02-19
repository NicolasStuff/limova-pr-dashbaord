"use client";

import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";

const views = [
  {
    path: "/board",
    label: "Board",
    icon: (
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <rect x="1" y="1" width="4" height="14" rx="1" />
        <rect x="6" y="1" width="4" height="9" rx="1" />
        <rect x="11" y="1" width="4" height="11" rx="1" />
      </svg>
    ),
  },
  {
    path: "/list",
    label: "List",
    icon: (
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <line x1="1" y1="3" x2="15" y2="3" />
        <line x1="1" y1="8" x2="15" y2="8" />
        <line x1="1" y1="13" x2="15" y2="13" />
      </svg>
    ),
  },
] as const;

export function ViewToggle() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="flex items-center rounded-md border border-border bg-bg-elevated/50 overflow-hidden">
      {views.map((view) => {
        const isActive = pathname === view.path;
        return (
          <button
            key={view.path}
            onClick={() => router.push(view.path)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono transition-all duration-150 cursor-pointer",
              isActive
                ? "bg-bg-elevated text-text-primary shadow-glow-sm"
                : "text-text-muted hover:text-text-secondary hover:bg-bg-hover"
            )}
          >
            {view.icon}
            <span className="hidden sm:inline">{view.label}</span>
          </button>
        );
      })}
    </div>
  );
}
