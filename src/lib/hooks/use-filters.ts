"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, useMemo } from "react";
import type { PrFilters } from "@/types/filters";
import type { PrColumn } from "@/types/pr";

export function useFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const filters: PrFilters = useMemo(() => {
    const columns = searchParams.get("columns");
    const repos = searchParams.get("repos");
    const labels = searchParams.get("labels");

    return {
      columns: columns
        ? (columns.split(",") as PrColumn[])
        : undefined,
      repos: repos ? repos.split(",").map(Number) : undefined,
      author: searchParams.get("author") || undefined,
      reviewer: searchParams.get("reviewer") || undefined,
      labels: labels ? labels.split(",") : undefined,
      search: searchParams.get("search") || undefined,
      sort: (searchParams.get("sort") as PrFilters["sort"]) || undefined,
      order: (searchParams.get("order") as PrFilters["order"]) || undefined,
      stale: searchParams.get("stale") === "true" || undefined,
    };
  }, [searchParams]);

  const setFilters = useCallback(
    (newFilters: Partial<PrFilters>) => {
      const params = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(newFilters)) {
        if (value === undefined || value === null || value === "") {
          params.delete(key);
        } else if (Array.isArray(value)) {
          if (value.length === 0) {
            params.delete(key);
          } else {
            params.set(key, value.join(","));
          }
        } else {
          params.set(key, String(value));
        }
      }

      const queryString = params.toString();
      router.push(`${pathname}${queryString ? `?${queryString}` : ""}`);
    },
    [searchParams, router, pathname]
  );

  const clearFilters = useCallback(() => {
    router.push(pathname);
  }, [router, pathname]);

  return { filters, setFilters, clearFilters };
}
