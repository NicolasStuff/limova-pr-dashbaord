"use client";

import { use } from "react";
import useSWR from "swr";
import type { PullRequestCard, PrReview } from "@/types/pr";
import type { PrColumn } from "@/types/pr";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";
import { useRouter } from "next/navigation";
import { formatDistanceToNow, format } from "date-fns";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

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
  ready_for_review: "Ready for Review",
  review_in_progress: "Review in Progress",
  changes_requested: "Changes Requested",
  approved: "Approved",
  merged: "Merged",
};

const reviewStateLabels: Record<string, { label: string; variant: "success" | "error" | "warning" | "info" | "default" }> = {
  APPROVED: { label: "Approved", variant: "success" },
  CHANGES_REQUESTED: { label: "Changes Requested", variant: "error" },
  COMMENTED: { label: "Commented", variant: "default" },
  DISMISSED: { label: "Dismissed", variant: "warning" },
  PENDING: { label: "Pending", variant: "info" },
};

function StatBlock({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-md bg-bg-surface border border-border-subtle p-3">
      <span className="text-2xs font-mono text-text-muted uppercase tracking-wider">{label}</span>
      <span className={cn("text-lg font-mono font-semibold tabular-nums", color ?? "text-text-primary")}>
        {value}
      </span>
    </div>
  );
}

function ReviewTimeline({ reviews }: { reviews: PrReview[] }) {
  if (reviews.length === 0) {
    return (
      <p className="text-xs text-text-muted font-mono py-4 text-center">
        No reviews yet
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {reviews.map((review) => {
        const stateInfo = reviewStateLabels[review.state] ?? { label: review.state, variant: "default" as const };
        return (
          <div key={review.id} className="flex items-start gap-3 rounded-md bg-bg-surface/50 border border-border-subtle p-3">
            <Avatar src={review.authorAvatarUrl} alt={review.authorLogin} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-text-primary">{review.authorLogin}</span>
                <Badge variant={stateInfo.variant} size="sm">{stateInfo.label}</Badge>
              </div>
              {review.body && (
                <p className="mt-1 text-xs text-text-secondary line-clamp-3">{review.body}</p>
              )}
              <p className="mt-1 text-2xs text-text-muted font-mono">
                {formatDistanceToNow(new Date(review.submittedAt), { addSuffix: true })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function PrDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: pr, isLoading, error } = useSWR<PullRequestCard & { reviews?: PrReview[] }>(
    `/api/prs/${id}`,
    fetcher
  );

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6 sm:p-6 space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error || !pr) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm text-status-error">Failed to load pull request.</p>
        <button
          onClick={() => router.back()}
          className="mt-3 text-xs text-text-secondary hover:text-text-primary transition-colors font-mono cursor-pointer"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:p-6 space-y-6 animate-fade-in">
      {/* Back button + actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          aria-label="Go back"
          className="flex items-center gap-1.5 text-xs font-mono text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M10 3L5 8l5 5" />
          </svg>
          Back
        </button>
        <a
          href={pr.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-mono bg-bg-surface text-text-primary border border-border hover:bg-bg-hover hover:border-border-strong transition-all"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="shrink-0">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
          </svg>
          View on GitHub
        </a>
      </div>

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant={columnVariants[pr.column]} size="md">
            {columnLabels[pr.column]}
          </Badge>
          <span className="text-sm font-mono text-text-muted">#{pr.number}</span>
          {pr.ciStatus && (
            <span
              className={cn(
                "inline-block h-2.5 w-2.5 rounded-full shrink-0",
                pr.ciStatus === "SUCCESS" && "bg-status-success",
                pr.ciStatus === "FAILURE" && "bg-status-error",
                pr.ciStatus === "PENDING" && "bg-status-warning ci-pulse",
                !["SUCCESS", "FAILURE", "PENDING"].includes(pr.ciStatus) && "bg-status-pending"
              )}
            />
          )}
        </div>
        <h1 className="text-xl font-semibold text-text-primary leading-snug">
          {pr.title}
        </h1>
        <div className="flex items-center gap-2 mt-2 text-xs font-mono text-text-secondary">
          <span>{pr.repositoryFullName}</span>
          {pr.baseRef && pr.headRef && (
            <>
              <span className="text-text-muted">&middot;</span>
              <span className="text-text-muted">{pr.baseRef}</span>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-muted">
                <path d="M11 4L6 8l5 4" />
              </svg>
              <span>{pr.headRef}</span>
            </>
          )}
        </div>
      </div>

      {/* Author */}
      <div className="flex items-center gap-3 rounded-md bg-bg-surface border border-border-subtle p-4">
        <Avatar src={pr.authorAvatarUrl} alt={pr.authorLogin} size="md" />
        <div>
          <p className="text-sm font-medium text-text-primary">{pr.authorLogin}</p>
          <p className="text-2xs text-text-muted font-mono">
            opened {formatDistanceToNow(new Date(pr.githubCreatedAt), { addSuffix: true })}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatBlock label="Files" value={pr.changedFiles} />
        <StatBlock label="Additions" value={`+${pr.additions}`} color="text-status-success" />
        <StatBlock label="Deletions" value={`-${pr.deletions}`} color="text-status-error" />
        <StatBlock label="Comments" value={pr.commentsCount} />
      </div>

      {/* Labels */}
      {pr.labels.length > 0 && (
        <div>
          <h3 className="text-2xs font-mono text-text-muted uppercase tracking-wider mb-2">Labels</h3>
          <div className="flex flex-wrap gap-1.5">
            {pr.labels.map((label) => (
              <Badge key={label} variant="default" size="md">
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
          <div className="flex flex-wrap gap-2">
            {pr.requestedReviewers.map((reviewer) => (
              <div key={reviewer.login} className="flex items-center gap-2 rounded-md bg-bg-surface border border-border-subtle px-3 py-2">
                <Avatar src={reviewer.avatarUrl} alt={reviewer.login} size="sm" />
                <span className="text-sm text-text-secondary">{reviewer.login}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviews Timeline */}
      <div>
        <h3 className="text-2xs font-mono text-text-muted uppercase tracking-wider mb-2">Reviews</h3>
        <ReviewTimeline reviews={pr.reviews ?? []} />
      </div>

      {/* Timestamps */}
      <div className="space-y-1.5 text-xs font-mono text-text-muted border-t border-border-subtle pt-4">
        <p>Created: {format(new Date(pr.githubCreatedAt), "MMM d, yyyy HH:mm")}</p>
        <p>Updated: {format(new Date(pr.githubUpdatedAt), "MMM d, yyyy HH:mm")}</p>
        {pr.mergedAt && (
          <p>Merged: {format(new Date(pr.mergedAt), "MMM d, yyyy HH:mm")}</p>
        )}
      </div>
    </div>
  );
}
