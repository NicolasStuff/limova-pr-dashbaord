"use client";

import type { Repository } from "@/types/repository";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface RepoListProps {
  repositories: Repository[];
  isLoading: boolean;
  onToggle: (id: number, isActive: boolean) => void;
  onDelete: (id: number) => void;
}

export function RepoList({ repositories, isLoading, onToggle, onDelete }: RepoListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (repositories.length === 0) {
    return (
      <div className="rounded-md border border-border-subtle bg-bg-surface py-8 text-center">
        <p className="text-sm text-text-secondary">No repositories tracked yet.</p>
        <p className="mt-1 text-xs text-text-muted font-mono">
          Add a repository above to start tracking PRs.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border-subtle rounded-md border border-border-subtle overflow-hidden">
      {repositories.map((repo) => (
        <div
          key={repo.id}
          className="flex items-center gap-3 bg-bg-surface px-4 py-3 transition-colors hover:bg-bg-hover"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-text-primary truncate">
                {repo.fullName}
              </span>
              <Badge variant={repo.isActive ? "success" : "default"} size="sm">
                {repo.isActive ? "Active" : "Paused"}
              </Badge>
            </div>
            <p className="text-2xs text-text-muted font-mono mt-0.5">
              default: {repo.defaultBranch}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggle(repo.id, !repo.isActive)}
            >
              {repo.isActive ? "Pause" : "Activate"}
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => onDelete(repo.id)}
            >
              Remove
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
