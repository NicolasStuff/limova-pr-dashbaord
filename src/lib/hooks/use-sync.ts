"use client";

import useSWR from "swr";
import useSWRMutation from "swr/mutation";

interface SyncStatus {
  lastSyncedAt: string | null;
  isSyncing: boolean;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

async function syncStatusFetcher(url: string): Promise<SyncStatus> {
  const data = await fetcher(url);
  return {
    lastSyncedAt: data.lastSync?.completedAt ?? data.lastSync?.startedAt ?? null,
    isSyncing: data.isRunning ?? false,
  };
}

export function useSyncStatus() {
  return useSWR<SyncStatus>("/api/sync/status", syncStatusFetcher, {
    refreshInterval: 10000,
  });
}

export function useTriggerSync() {
  return useSWRMutation("/api/sync", (url: string) =>
    fetch(url, { method: "POST" }).then((r) => r.json())
  );
}
