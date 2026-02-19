"use client";

import { useEffect, useCallback } from "react";
import Link from "next/link";
import type { PullRequestCard } from "@/types/pr";
import { cn } from "@/lib/utils/cn";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CiStatusPanel } from "./ci-status-panel";
import { formatDistanceToNow, format } from "date-fns";

interface PrCardDetailProps {
  pr: PullRequestCard;
  onClose: () => void;
}

const columnLabels: Record<string, string> = {
  draft: "Draft",
  ready_for_review: "Ready for Review",
  review_in_progress: "Review in Progress",
  changes_requested: "Changes Requested",
  approved: "Approved",
  merged: "Merged",
};

const columnVariants: Record<string, "draft" | "ready" | "in-progress" | "changes" | "approved" | "merged"> = {
  draft: "draft",
  ready_for_review: "ready",
  review_in_progress: "in-progress",
  changes_requested: "changes",
  approved: "approved",
  merged: "merged",
};

function StatItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-2xs font-mono text-text-muted uppercase tracking-wider">{label}</span>
      <span className="text-sm font-mono text-text-primary tabular-nums">{value}</span>
    </div>
  );
}

export function PrCardDetail({ pr, onClose }: PrCardDetailProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div role="dialog" aria-label={`Pull request: ${pr.title}`} className="fixed inset-y-0 right-0 z-50 w-full max-w-lg overflow-y-auto border-l border-border bg-bg-primary animate-slide-in-right">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border-subtle bg-bg-primary/95 backdrop-blur-sm px-5 py-3">
          <div className="flex items-center gap-2">
            <Badge variant={columnVariants[pr.column]} size="md">
              {columnLabels[pr.column]}
            </Badge>
            <span className="text-xs font-mono text-text-muted">
              #{pr.number}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/pr/${pr.id}`}
              className="inline-flex items-center justify-center rounded-md font-medium font-sans h-7 px-2.5 text-xs bg-bg-surface text-text-primary border border-border hover:bg-bg-hover hover:border-border-strong transition-all duration-150"
            >
              Full details
            </Link>
            <a
              href={pr.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-md font-medium font-sans h-7 px-2.5 text-xs bg-bg-surface text-text-primary border border-border hover:bg-bg-hover hover:border-border-strong transition-all duration-150"
            >
              GitHub
            </a>
            <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close detail panel">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="4" y1="4" x2="12" y2="12" />
                <line x1="12" y1="4" x2="4" y2="12" />
              </svg>
            </Button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Title */}
          <h2 className="text-base font-semibold text-text-primary leading-snug">
            {pr.title}
          </h2>

          {/* Repo + branches */}
          <div className="flex items-center gap-2 text-xs font-mono text-text-secondary">
            <span>{pr.repositoryFullName}</span>
            {pr.baseRef && pr.headRef && (
              <>
                <span className="text-text-muted">/</span>
                <span className="text-text-muted">{pr.baseRef}</span>
                <span className="text-text-muted">&larr;</span>
                <span>{pr.headRef}</span>
              </>
            )}
          </div>

          {/* Author */}
          <div className="flex items-center gap-3 rounded-md bg-bg-surface border border-border-subtle p-3">
            <Avatar src={pr.authorAvatarUrl} alt={pr.authorLogin} size="md" />
            <div>
              <p className="text-sm font-medium text-text-primary">{pr.authorLogin}</p>
              <p className="text-2xs text-text-muted font-mono">
                opened {formatDistanceToNow(new Date(pr.githubCreatedAt), { addSuffix: true })}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3 rounded-md bg-bg-surface border border-border-subtle p-3">
            <StatItem label="Files" value={pr.changedFiles} />
            <StatItem label="Additions" value={`+${pr.additions}`} />
            <StatItem label="Deletions" value={`-${pr.deletions}`} />
            <StatItem label="Comments" value={pr.commentsCount} />
          </div>

          {/* Labels */}
          {pr.labels.length > 0 && (
            <div>
              <h3 className="text-2xs font-mono text-text-muted uppercase tracking-wider mb-2">Labels</h3>
              <div className="flex flex-wrap gap-1.5">
                {pr.labels.filter(Boolean).map((label, index) => (
                  <Badge key={`${label}-${index}`} variant="default" size="md">
                    {label}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Reviewers */}
          {pr.requestedReviewers.length > 0 && (
            <div>
              <h3 className="text-2xs font-mono text-text-muted uppercase tracking-wider mb-2">Requested Reviewers</h3>
              <div className="space-y-2">
                {pr.requestedReviewers.filter((r) => r.login).map((reviewer, index) => (
                  <div key={`${reviewer.login}-${index}`} className="flex items-center gap-2">
                    <Avatar src={reviewer.avatarUrl} alt={reviewer.login || "?"} size="sm" />
                    <span className="text-sm text-text-secondary">{reviewer.login}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CI Status — detailed checks fetched live from GitHub */}
          <CiStatusPanel prId={pr.id} />

          {/* Timestamps */}
          <div className="space-y-1.5 text-xs font-mono text-text-muted border-t border-border-subtle pt-4">
            <p>Created: {format(new Date(pr.githubCreatedAt), "MMM d, yyyy HH:mm")}</p>
            <p>Updated: {format(new Date(pr.githubUpdatedAt), "MMM d, yyyy HH:mm")}</p>
            {pr.mergedAt && (
              <p>Merged: {format(new Date(pr.mergedAt), "MMM d, yyyy HH:mm")}</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
