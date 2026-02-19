"use client";

import { Suspense, useState, useMemo } from "react";
import { usePRs } from "@/lib/hooks/use-prs";
import { useFilters } from "@/lib/hooks/use-filters";
import { FilterBar } from "@/components/filters/filter-bar";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";
import { formatDistanceToNow } from "date-fns";
import type { PullRequestCard, PrColumn } from "@/types/pr";
import { COLUMN_ORDER } from "@/lib/utils/constants";

type SortKey = "title" | "status" | "stats" | "updated";
type SortDirection = "asc" | "desc";
type SortConfig = { key: SortKey; direction: SortDirection };

const STATUS_ORDER: Record<PrColumn, number> = {
  draft: 0,
  ready_for_review: 1,
  review_in_progress: 2,
  changes_requested: 3,
  approved: 4,
  merged: 5,
};

const columnVariants: Record<PrColumn, "draft" | "ready" | "in-progress" | "changes" | "approved" | "merged"> = {
  draft: "draft",
  ready_for_review: "ready",
  review_in_progress: "in-progress",
  changes_requested: "changes",
  approved: "approved",
  merged: "merged",
};

const columnLabels: Record<PrColumn, string> = {
  draft: "Draft",
  ready_for_review: "Ready",
  review_in_progress: "In Progress",
  changes_requested: "Changes",
  approved: "Approved",
  merged: "Merged",
};

function PrRow({ pr, index }: { pr: PullRequestCard; index: number }) {
  return (
    <a
      href={pr.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex items-center gap-4 px-4 py-3 transition-all duration-200 hover:bg-bg-hover",
        "border-l-3 border-l-transparent",
        "animate-slide-up"
      )}
      style={{
        borderLeftColor: `var(--color-column-${columnVariants[pr.column]})`,
        animationDelay: `${Math.min(index * 30, 300)}ms`,
        animationFillMode: "backwards",
      }}
    >
      <Avatar src={pr.authorAvatarUrl} alt={pr.authorLogin} size="sm" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text-primary truncate">
            {pr.title}
          </span>
          {pr.ciStatus && (
            <span
              className={cn(
                "inline-block h-2 w-2 rounded-full shrink-0",
                pr.ciStatus === "SUCCESS" && "bg-status-success",
                pr.ciStatus === "FAILURE" && "bg-status-error",
                pr.ciStatus === "PENDING" && "bg-status-warning ci-pulse"
              )}
            />
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-2xs font-mono text-text-muted">{pr.repositoryFullName}</span>
          <span className="text-2xs font-mono text-text-muted">#{pr.number}</span>
          <span className="text-2xs text-text-muted hidden sm:inline">by {pr.authorLogin}</span>
        </div>
      </div>

      <Badge variant={columnVariants[pr.column]} size="sm" className="hidden sm:inline-flex">
        {columnLabels[pr.column]}
      </Badge>

      <div className="hidden md:flex items-center gap-3 text-2xs font-mono text-text-muted tabular-nums shrink-0">
        <span className="text-status-success">+{pr.additions}</span>
        <span className="text-status-error">-{pr.deletions}</span>
        <span>{pr.changedFiles}f</span>
        {pr.commentsCount > 0 && <span>{pr.commentsCount}c</span>}
      </div>

      <span className="text-2xs text-text-muted font-mono shrink-0 w-20 text-right hidden sm:block">
        {formatDistanceToNow(new Date(pr.githubUpdatedAt), { addSuffix: true })}
      </span>
    </a>
  );
}

function SortIndicator({ sortKey, sortConfig }: { sortKey: SortKey; sortConfig: SortConfig | null }) {
  if (!sortConfig || sortConfig.key !== sortKey) return null;
  return (
    <span className="ml-1 text-text-secondary">
      {sortConfig.direction === "asc" ? "↑" : "↓"}
    </span>
  );
}

function ListContent() {
  const { filters } = useFilters();
  const { data, isLoading, error } = usePRs(filters);
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

  const handleSort = (key: SortKey) => {
    setSortConfig((prev) => {
      if (!prev || prev.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      return null;
    });
  };

  const allPrs = useMemo(
    () => COLUMN_ORDER.flatMap((col) => data?.columns[col] ?? []),
    [data]
  );

  const sortedPrs = useMemo(() => {
    if (!sortConfig) return allPrs;

    return [...allPrs].sort((a, b) => {
      let cmp = 0;
      switch (sortConfig.key) {
        case "title":
          cmp = a.title.localeCompare(b.title);
          break;
        case "status":
          cmp = STATUS_ORDER[a.column] - STATUS_ORDER[b.column];
          break;
        case "stats":
          cmp = (a.additions + a.deletions) - (b.additions + b.deletions);
          break;
        case "updated":
          cmp = new Date(a.githubUpdatedAt).getTime() - new Date(b.githubUpdatedAt).getTime();
          break;
      }
      return sortConfig.direction === "asc" ? cmp : -cmp;
    });
  }, [allPrs, sortConfig]);

  if (isLoading) {
    return (
      <div className="space-y-1 p-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-status-error">
        Failed to load pull requests.
      </div>
    );
  }

  if (allPrs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm text-text-secondary">No pull requests found.</p>
        <p className="mt-1 text-xs text-text-muted font-mono">Try adjusting your filters.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border-subtle">
      {/* Table header */}
      <div className="flex items-center gap-4 px-4 py-2 text-2xs font-mono text-text-muted uppercase tracking-wider bg-bg-surface/50 sticky top-0 z-10">
        <span className="w-6" />
        <button type="button" onClick={() => handleSort("title")} className="flex-1 text-left cursor-pointer hover:text-text-primary transition-colors">
          Pull Request<SortIndicator sortKey="title" sortConfig={sortConfig} />
        </button>
        <button type="button" onClick={() => handleSort("status")} className="w-20 text-left cursor-pointer hover:text-text-primary transition-colors hidden sm:block">
          Status<SortIndicator sortKey="status" sortConfig={sortConfig} />
        </button>
        <button type="button" onClick={() => handleSort("stats")} className="w-32 text-center cursor-pointer hover:text-text-primary transition-colors hidden md:block">
          Stats<SortIndicator sortKey="stats" sortConfig={sortConfig} />
        </button>
        <button type="button" onClick={() => handleSort("updated")} className="w-20 text-right cursor-pointer hover:text-text-primary transition-colors hidden sm:block">
          Updated<SortIndicator sortKey="updated" sortConfig={sortConfig} />
        </button>
      </div>

      {sortedPrs.map((pr, i) => (
        <PrRow key={pr.id} pr={pr} index={i} />
      ))}
    </div>
  );
}

export default function ListPage() {
  return (
    <div className="flex flex-col h-full">
      <FilterBar />
      <div className="flex-1 overflow-auto">
        <Suspense fallback={<div className="p-4 space-y-1">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>}>
          <ListContent />
        </Suspense>
      </div>
    </div>
  );
}
