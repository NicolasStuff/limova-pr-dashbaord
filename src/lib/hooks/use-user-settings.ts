"use client";

import useSWR from "swr";

interface UserSettings {
  repoBasePath: string | null;
}

const fetcher = (url: string) =>
  fetch(url).then(async (res) => {
    if (!res.ok) throw new Error("Failed to fetch settings");
    return res.json();
  });

export function useUserSettings() {
  const { data, error, isLoading, mutate } = useSWR<UserSettings>(
    "/api/user/settings",
    fetcher,
    { revalidateOnFocus: false }
  );

  async function updateRepoPath(path: string) {
    const res = await fetch("/api/user/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repoBasePath: path }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error ?? "Failed to update settings");
    }

    const updated = await res.json();
    mutate(updated, false);
    return updated;
  }

  return {
    settings: data ?? null,
    isLoading,
    isError: !!error,
    updateRepoPath,
  };
}
