"use client";

import { usePathname } from "next/navigation";
import { useTriggerSync } from "@/lib/hooks/use-sync";
import { cn } from "@/lib/utils/cn";
import { SyncIndicator } from "./sync-indicator";
import { ViewToggle } from "./view-toggle";
import { Button } from "@/components/ui/button";

const pageTitles: Record<string, string> = {
  "/board": "Board",
  "/list": "List",
  "/settings/repositories": "Settings",
};

interface HeaderProps {
  onMenuToggle?: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const pathname = usePathname();
  const { trigger, isMutating } = useTriggerSync();

  const title = pageTitles[pathname] ?? "Dashboard";
  const showViewToggle = pathname === "/board" || pathname === "/list";

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-bg-primary/80 backdrop-blur-sm px-4 md:px-6">
      <div className="flex items-center gap-3 md:gap-4">
        {/* Mobile hamburger */}
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            aria-label="Open menu"
            className="md:hidden p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="2" y1="4" x2="14" y2="4" />
              <line x1="2" y1="8" x2="14" y2="8" />
              <line x1="2" y1="12" x2="14" y2="12" />
            </svg>
          </button>
        )}
        <h1 className="text-sm font-semibold text-text-primary font-mono uppercase tracking-wider">
          {title}
        </h1>
        {showViewToggle && <ViewToggle />}
      </div>

      <div className="flex items-center gap-3 md:gap-4">
        <div className="hidden sm:block">
          <SyncIndicator />
        </div>
        <Button
          onClick={() => trigger()}
          disabled={isMutating}
          variant="secondary"
          size="sm"
          className={cn(isMutating && "cursor-not-allowed")}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            className={cn("shrink-0", isMutating && "animate-spin")}
          >
            <path d="M14 8A6 6 0 104 3.5" />
            <path d="M4 1v3h3" />
          </svg>
          <span className="hidden sm:inline">{isMutating ? "Syncing..." : "Sync"}</span>
        </Button>
      </div>
    </header>
  );
}
