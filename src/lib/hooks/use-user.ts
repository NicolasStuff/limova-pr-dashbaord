"use client";

import useSWR from "swr";

interface User {
  id: number;
  email: string;
  createdAt: string;
  updatedAt: string;
}

const fetcher = (url: string) =>
  fetch(url).then(async (res) => {
    if (!res.ok) {
      const error = new Error("Not authenticated") as Error & { status?: number };
      error.status = res.status;
      throw error;
    }
    return res.json();
  });

export function useUser() {
  const { data, error, isLoading } = useSWR<User>("/api/auth/me", fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });

  return {
    user: data ?? null,
    isLoading,
    isError: !!error,
  };
}
