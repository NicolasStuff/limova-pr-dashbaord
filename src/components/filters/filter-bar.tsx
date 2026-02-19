"use client";

import { Suspense } from "react";
import { useFilters } from "@/lib/hooks/use-filters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RepoFilter } from "./repo-filter";
import { AuthorFilter } from "./author-filter";
import { ReviewerFilter } from "./reviewer-filter";
import { LabelFilter } from "./label-filter";
import { SearchFilter } from "./search-filter";

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8 1.5L1 13.5H15L8 1.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M8 6.5V9.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="8" cy="11.5" r="0.75" fill="currentColor" />
    </svg>
  );
}

function AlertButton({
  staleCount,
  active,
  onClick,
}: {
  staleCount: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        relative flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium
        transition-all duration-200 cursor-pointer select-none
        ${
          active
            ? "bg-status-error text-white alert-glow-active"
            : "bg-transparent border border-status-error/20 text-status-error hover:border-status-error/40 hover:bg-status-error/5"
        }
      `}
    >
      <AlertIcon className="shrink-0" />
      <span>Alerte</span>
      {staleCount > 0 && (
        <span
          className={`
            ml-0.5 inline-flex items-center justify-center rounded-full px-1.5 text-2xs font-semibold min-w-[1.25rem]
            ${active ? "bg-white/20 text-white" : "bg-status-error/10 text-status-error"}
          `}
        >
          {staleCount}
        </span>
      )}
    </button>
  );
}

function FilterBarInner({ staleCount }: { staleCount: number }) {
  const { filters, setFilters, clearFilters } = useFilters();

  const activeCount =
    (filters.repos?.length ?? 0) +
    (filters.author ? 1 : 0) +
    (filters.reviewer ? 1 : 0) +
    (filters.labels?.length ?? 0) +
    (filters.search ? 1 : 0);

  const hasActiveFilters = activeCount > 0;

  return (
    <div className="flex items-center gap-2 border-b border-border-subtle bg-bg-surface/50 px-4 py-2">
      <AlertButton
        staleCount={staleCount}
        active={!!filters.stale}
        onClick={() => setFilters({ stale: !filters.stale || undefined })}
      />

      <div className="h-4 w-px bg-border" />

      <SearchFilter
        value={filters.search ?? ""}
        onChange={(search) => setFilters({ search: search || undefined })}
      />

      <div className="h-4 w-px bg-border" />

      <RepoFilter
        value={filters.repos ?? []}
        onChange={(repos) => setFilters({ repos: repos.length ? repos : undefined })}
      />
      <AuthorFilter
        value={filters.author ?? ""}
        onChange={(author) => setFilters({ author: author || undefined })}
      />
      <ReviewerFilter
        value={filters.reviewer ?? ""}
        onChange={(reviewer) => setFilters({ reviewer: reviewer || undefined })}
      />
      <LabelFilter
        value={filters.labels ?? []}
        onChange={(labels) => setFilters({ labels: labels.length ? labels : undefined })}
      />

      {hasActiveFilters && (
        <>
          <div className="h-4 w-px bg-border" />
          <Badge variant="info" size="sm">{activeCount}</Badge>
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear all
          </Button>
        </>
      )}
    </div>
  );
}

export function FilterBar({ staleCount = 0 }: { staleCount?: number }) {
  return (
    <Suspense fallback={<div className="h-10 border-b border-border-subtle bg-bg-surface/50" />}>
      <FilterBarInner staleCount={staleCount} />
    </Suspense>
  );
}
