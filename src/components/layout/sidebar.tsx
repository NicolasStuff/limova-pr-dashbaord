"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { SyncIndicator } from "./sync-indicator";
import { UserMenu } from "./user-menu";
import { Tooltip } from "@/components/ui/tooltip";

const navItems = [
  {
    href: "/board",
    label: "Board",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="1" y="1" width="4" height="14" rx="1" />
        <rect x="6" y="1" width="4" height="9" rx="1" />
        <rect x="11" y="1" width="4" height="11" rx="1" />
      </svg>
    ),
  },
  {
    href: "/list",
    label: "List",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="1" y1="3" x2="15" y2="3" />
        <line x1="1" y1="8" x2="15" y2="8" />
        <line x1="1" y1="13" x2="15" y2="13" />
      </svg>
    ),
  },
  {
    href: "/settings/repositories",
    label: "Settings",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="8" cy="8" r="2.5" />
        <path d="M8 1v2M8 13v2M1 8h2M13 8h2M2.9 2.9l1.4 1.4M11.7 11.7l1.4 1.4M13.1 2.9l-1.4 1.4M4.3 11.7l-1.4 1.4" />
      </svg>
    ),
  },
];

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-border bg-bg-primary">
      {/* Logo + mobile close */}
      <div className="flex h-14 items-center justify-between px-5">
        <span className="text-sm font-bold tracking-[0.2em] text-text-primary font-mono uppercase">
          Limova
        </span>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close sidebar"
            className="md:hidden p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="4" y1="4" x2="12" y2="12" />
              <line x1="12" y1="4" x2="4" y2="12" />
            </svg>
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => {
                if (window.innerWidth < 768 && onClose) onClose();
              }}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-sans transition-all duration-150",
                isActive
                  ? "bg-bg-elevated text-text-primary border border-border-subtle shadow-glow-sm"
                  : "text-text-muted hover:bg-bg-hover hover:text-text-secondary"
              )}
            >
              <span className="shrink-0">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User menu */}
      <div className="border-t border-border px-2 py-2">
        <UserMenu />
      </div>

      {/* Sync status */}
      <div className="border-t border-border px-5 py-3">
        <SyncIndicator />
      </div>
    </aside>
  );
}
