"use client";

import { useUser } from "@/lib/hooks/use-user";
import { Avatar } from "@/components/ui/avatar";

export function UserMenu() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 px-3 py-2">
        <div className="h-8 w-8 animate-pulse rounded-full bg-bg-elevated" />
        <div className="h-4 w-20 animate-pulse rounded bg-bg-elevated" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2">
      <div className="flex items-center gap-3 min-w-0">
        <Avatar alt={user.email} size="md" />
        <span className="truncate text-sm text-text-secondary">
          {user.email}
        </span>
      </div>
      <form action="/api/auth/logout" method="POST">
        <button
          type="submit"
          className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-bg-hover hover:text-text-secondary cursor-pointer"
          title="Se déconnecter"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
            />
          </svg>
        </button>
      </form>
    </div>
  );
}
