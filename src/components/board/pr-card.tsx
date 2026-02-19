"use client";

import type { PullRequestCard } from "@/types/pr";
import type { PrColumn } from "@/types/pr";
import { cn } from "@/lib/utils/cn";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/tooltip";
import { formatDistanceToNow } from "date-fns";

interface PrCardProps {
  pr: PullRequestCard;
  onClick?: () => void;
}

const columnToVariant: Record<PrColumn, "draft" | "ready" | "in-progress" | "changes" | "approved" | "merged"> = {
  draft: "draft",
  ready_for_review: "ready",
  review_in_progress: "in-progress",
  changes_requested: "changes",
  approved: "approved",
  merged: "merged",
};

function CiStatusDot({ status }: { status: string | null }) {
  if (!status) return null;

  const color =
    status === "SUCCESS"
      ? "bg-status-success"
      : status === "FAILURE"
        ? "bg-status-error"
        : status === "PENDING"
          ? "bg-status-warning ci-pulse"
          : "bg-status-pending";

  const label =
    status === "SUCCESS"
      ? "CI passed"
      : status === "FAILURE"
        ? "CI failed"
        : status === "PENDING"
          ? "CI running"
          : "CI unknown";

  return (
    <Tooltip content={label} position="top">
      <span className={cn("inline-block h-2 w-2 rounded-full shrink-0", color)} />
    </Tooltip>
  );
}

function DiffBar({ additions, deletions }: { additions: number; deletions: number }) {
  const total = additions + deletions;
  if (total === 0) return null;
  const addPct = Math.round((additions / total) * 100);

  return (
    <Tooltip content={`+${additions} / -${deletions}`} position="top">
      <div className="flex h-1 w-10 overflow-hidden rounded-full bg-bg-elevated">
        <div className="bg-status-success" style={{ width: `${addPct}%` }} />
        <div className="bg-status-error flex-1" />
      </div>
    </Tooltip>
  );
}

export function PrCard({ pr, onClick }: PrCardProps) {
  const accentClass = `card-accent-${columnToVariant[pr.column]}`;
  const timeAgo = formatDistanceToNow(new Date(pr.githubUpdatedAt), { addSuffix: true });

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-md bg-bg-surface border border-border-subtle p-3",
        "shadow-card transition-all duration-200 ease-out",
        "hover:shadow-card-hover hover:border-border hover:bg-bg-elevated hover:-translate-y-0.5",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-info/50",
        "cursor-pointer",
        accentClass
      )}
    >
      {/* Title row */}
      <div className="flex items-start gap-2">
        <p className="text-xs font-medium leading-snug text-text-primary line-clamp-2 flex-1">
          {pr.title}
        </p>
        <CiStatusDot status={pr.ciStatus} />
      </div>

      {/* Repo + PR number */}
      <div className="mt-1.5 flex items-center gap-1.5">
        <span className="text-2xs font-mono text-text-muted truncate">
          {pr.repositoryFullName}
        </span>
        <span className="text-2xs font-mono text-text-muted">
          #{pr.number}
        </span>
      </div>

      {/* Labels */}
      {pr.labels.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {pr.labels.filter(Boolean).slice(0, 3).map((label, index) => (
            <span
              key={`${label}-${index}`}
              className="rounded px-1 py-0.5 text-2xs font-mono bg-status-info/10 text-status-info/80 border border-status-info/15"
            >
              {label}
            </span>
          ))}
          {pr.labels.length > 3 && (
            <span className="text-2xs text-text-muted">+{pr.labels.length - 3}</span>
          )}
        </div>
      )}

      {/* Bottom row: author, reviewers, stats */}
      <div className="mt-2.5 flex items-center gap-2">
        {/* Author */}
        <Tooltip content={pr.authorLogin} position="bottom">
          <Avatar
            src={pr.authorAvatarUrl}
            alt={pr.authorLogin}
            size="sm"
          />
        </Tooltip>

        {/* Requested reviewers */}
        {pr.requestedReviewers.length > 0 && (
          <div className="flex -space-x-1.5">
            {pr.requestedReviewers.filter((r) => r.login).slice(0, 3).map((reviewer, index) => (
              <Tooltip key={`${reviewer.login}-${index}`} content={reviewer.login} position="bottom">
                <Avatar
                  src={reviewer.avatarUrl}
                  alt={reviewer.login}
                  size="sm"
                  className="ring-1 ring-bg-surface"
                />
              </Tooltip>
            ))}
            {pr.requestedReviewers.length > 3 && (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-bg-elevated text-2xs text-text-muted ring-1 ring-bg-surface">
                +{pr.requestedReviewers.length - 3}
              </span>
            )}
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          {/* Comments */}
          {pr.commentsCount > 0 && (
            <span className="flex items-center gap-0.5 text-2xs text-text-muted font-mono tabular-nums">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" className="shrink-0">
                <path d="M1 2.75C1 1.784 1.784 1 2.75 1h10.5c.966 0 1.75.784 1.75 1.75v7.5A1.75 1.75 0 0113.25 12H9.06l-2.573 2.573A1.458 1.458 0 014 13.543V12H2.75A1.75 1.75 0 011 10.25v-7.5z" />
              </svg>
              {pr.commentsCount}
            </span>
          )}

          {/* Diff stats */}
          <DiffBar additions={pr.additions} deletions={pr.deletions} />

          {/* Changed files */}
          <span className="text-2xs text-text-muted font-mono tabular-nums">
            {pr.changedFiles}f
          </span>
        </div>
      </div>

      {/* Time ago */}
      <div className="mt-1.5 text-2xs text-text-muted font-mono">
        {timeAgo}
      </div>
    </button>
  );
}
