"use client";

import useSWR from "swr";
import type { BoardData } from "@/types/pr";
import type { PrFilters } from "@/types/filters";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function usePRs(filters?: PrFilters) {
  const params = new URLSearchParams();
  if (filters?.columns?.length)
    params.set("columns", filters.columns.join(","));
  if (filters?.repos?.length) params.set("repos", filters.repos.join(","));
  if (filters?.author) params.set("author", filters.author);
  if (filters?.reviewer) params.set("reviewer", filters.reviewer);
  if (filters?.labels?.length) params.set("labels", filters.labels.join(","));
  if (filters?.search) params.set("search", filters.search);
  if (filters?.sort) params.set("sort", filters.sort);
  if (filters?.order) params.set("order", filters.order);
  if (filters?.stale) params.set("stale", "true");

  const queryString = params.toString();
  const url = `/api/prs${queryString ? `?${queryString}` : ""}`;

  return useSWR<BoardData>(url, fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: true,
  });
}
