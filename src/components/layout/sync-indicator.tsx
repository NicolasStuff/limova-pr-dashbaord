"use client";

import { useSyncStatus } from "@/lib/hooks/use-sync";
import { cn } from "@/lib/utils/cn";
import { Tooltip } from "@/components/ui/tooltip";
import { formatDistanceToNow } from "date-fns";

interface SyncIndicatorProps {
  compact?: boolean;
}

export function SyncIndicator({ compact }: SyncIndicatorProps) {
  const { data, isLoading } = useSyncStatus();

  const isSyncing = data?.isSyncing ?? false;
  const lastSyncedAt = data?.lastSyncedAt;

  const label = isSyncing
    ? "Syncing..."
    : lastSyncedAt
      ? `Synced ${formatDistanceToNow(new Date(lastSyncedAt), { addSuffix: true })}`
      : "Never synced";

  const dot = (
    <span
      className={cn(
        "inline-block h-2 w-2 rounded-full shrink-0",
        isSyncing && "animate-pulse bg-status-warning",
        !isSyncing && lastSyncedAt && "bg-status-success",
        !isSyncing && !lastSyncedAt && "bg-status-pending"
      )}
    />
  );

  if (compact) {
    return (
      <Tooltip content={label} position="right">
        {dot}
      </Tooltip>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs text-text-muted font-mono">
      {dot}
      {isLoading ? (
        <span className="text-text-muted">...</span>
      ) : (
        <span>{label}</span>
      )}
    </div>
  );
}
