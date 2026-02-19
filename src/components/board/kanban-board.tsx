"use client";

import { Suspense, useEffect, useMemo, useState, useCallback } from "react";
import { usePRs } from "@/lib/hooks/use-prs";
import { useFilters } from "@/lib/hooks/use-filters";
import { COLUMN_ORDER, COLUMNS } from "@/lib/utils/constants";
import { cn } from "@/lib/utils/cn";
import { KanbanColumn } from "./kanban-column";
import { FilterBar } from "@/components/filters/filter-bar";
import { Skeleton } from "@/components/ui/skeleton";
import type { BoardData } from "@/types/pr";

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

function computeStaleCount(data: BoardData | undefined): number {
  if (!data) return 0;
  const now = Date.now();
  let count = 0;
  for (const [column, cards] of Object.entries(data.columns)) {
    if (column === "merged") continue;
    for (const card of cards) {
      if (now - new Date(card.githubCreatedAt).getTime() > THREE_DAYS_MS) {
        count++;
      }
    }
  }
  return count;
}

function BoardContent({ onStaleCount }: { onStaleCount: (count: number) => void }) {
  const { filters } = useFilters();
  const { data, isLoading, error } = usePRs(filters);

  const staleCount = useMemo(() => computeStaleCount(data), [data]);

  useEffect(() => { onStaleCount(staleCount); }, [staleCount, onStaleCount]);

  if (isLoading) {
    return (
      <div className="flex h-full gap-4 overflow-x-auto p-4">
        {COLUMN_ORDER.map((col) => (
          <div key={col} className="flex h-full w-72 min-w-72 flex-col rounded-lg border border-border-subtle bg-bg-primary/50">
            <Skeleton className="h-10 w-full rounded-t-lg rounded-b-none" />
            <div className="flex-1 p-2 space-y-2">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-status-error">
        Failed to load pull requests.
      </div>
    );
  }

  return (
    <div className="flex h-full gap-4 overflow-x-auto p-4 snap-x snap-mandatory md:snap-none">
      {COLUMN_ORDER.map((columnKey, index) => (
        <div
          key={columnKey}
          className={cn(
            "animate-stagger-in snap-center",
            `stagger-${index + 1}`
          )}
        >
          <KanbanColumn
            definition={COLUMNS[columnKey]}
            cards={data?.columns[columnKey] ?? []}
          />
        </div>
      ))}
    </div>
  );
}

export function KanbanBoard() {
  const [staleCount, setStaleCount] = useState(0);
  const handleStaleCount = useCallback((count: number) => setStaleCount(count), []);

  return (
    <div className="flex flex-col h-full">
      <FilterBar staleCount={staleCount} />
      <div className="flex-1 overflow-hidden">
        <Suspense fallback={<div className="flex h-full items-center justify-center text-sm text-text-muted">Loading...</div>}>
          <BoardContent onStaleCount={handleStaleCount} />
        </Suspense>
      </div>
    </div>
  );
}
