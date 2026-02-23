"use client";

import { useState, useCallback, useEffect } from "react";
import useSWR from "swr";
import type {
  ClaudeReviewParams,
  ClaudeReviewStatus,
  ReviewFinding,
  ReviewHistoryItem,
} from "@/types/claude-review";

const fetcher = (url: string) =>
  fetch(url).then(async (res) => {
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`HTTP ${res.status}`);
    }
    return res.json();
  });

export function useClaudeReview(
  prNumber: number,
  repositoryFullName: string,
  pullRequestId: number
) {
  const [activeReviewId, setActiveReviewId] = useState<number | null>(null);

  // Poll active review status
  const {
    data: activeReview,
    mutate: mutateReview,
  } = useSWR<ClaudeReviewStatus | null>(
    activeReviewId ? `/api/claude-review/${activeReviewId}/status` : null,
    fetcher,
    {
      refreshInterval:
        activeReviewId
          ? (data: ClaudeReviewStatus | null | undefined) => {
              if (!data) return 2000;
              if (data.status === "running" || data.status === "pending") return 2000;
              return 0;
            }
          : 0,
      revalidateOnFocus: false,
    }
  );

  // Fetch review history for this PR
  const {
    data: history,
    isLoading: isLoadingHistory,
    mutate: mutateHistory,
  } = useSWR<ReviewHistoryItem[]>(
    pullRequestId ? `/api/claude-review/history/${pullRequestId}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  // Auto-reconnect: on mount, if a review is running, pick it up
  useEffect(() => {
    if (history && history.length > 0 && !activeReviewId) {
      const runningReview = history.find(
        (r) => r.status === "running" || r.status === "pending"
      );
      if (runningReview) {
        setActiveReviewId(runningReview.id);
      }
    }
  }, [history, activeReviewId]);

  const isRunning = activeReview?.status === "running" || activeReview?.status === "pending";
  const isCompleted = activeReview?.status === "completed";
  const isFailed = activeReview?.status === "failed" || activeReview?.status === "cancelled";

  const launch = useCallback(
    async (config: Omit<ClaudeReviewParams, "prNumber" | "repositoryFullName" | "pullRequestId">) => {
      try {
        const res = await fetch("/api/claude-review/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prNumber,
            repositoryFullName,
            pullRequestId,
            ...config,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Request failed" }));
          throw new Error(err.error ?? `HTTP ${res.status}`);
        }

        const data = await res.json();
        setActiveReviewId(data.reviewId);
        mutateHistory();
        return data.reviewId;
      } catch (err) {
        throw err;
      }
    },
    [prNumber, repositoryFullName, pullRequestId, mutateHistory]
  );

  const cancel = useCallback(async () => {
    if (!activeReviewId) return;

    await fetch(`/api/claude-review/${activeReviewId}/cancel`, {
      method: "POST",
    });

    mutateReview();
    mutateHistory();
  }, [activeReviewId, mutateReview, mutateHistory]);

  const viewReview = useCallback(
    (reviewId: number) => {
      setActiveReviewId(reviewId);
    },
    []
  );

  const resetView = useCallback(() => {
    setActiveReviewId(null);
  }, []);

  const postSingleFinding = useCallback(
    async (finding: ReviewFinding): Promise<boolean> => {
      try {
        const res = await fetch("/api/claude-review/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "single",
            prNumber,
            repositoryFullName,
            reviewId: activeReviewId,
            finding: {
              id: finding.id,
              dbId: finding.dbId,
              file: finding.file,
              line: finding.line,
              severity: finding.severity,
              comment: finding.comment,
              suggestion: finding.suggestion,
            },
          }),
        });

        if (!res.ok) return false;

        mutateReview();
        return true;
      } catch {
        return false;
      }
    },
    [prNumber, repositoryFullName, activeReviewId, mutateReview]
  );

  const postAllFindings = useCallback(async (): Promise<boolean> => {
    if (!activeReview) return false;

    const unpostedFindings = activeReview.findings.filter((f) => !f.posted);
    if (unpostedFindings.length === 0) return true;

    try {
      const res = await fetch("/api/claude-review/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "all",
          prNumber,
          repositoryFullName,
          reviewId: activeReviewId,
          status: activeReview.resultStatus,
          body: activeReview.resultBody,
          findings: unpostedFindings.map((f) => ({
            id: f.id,
            dbId: f.dbId,
            file: f.file,
            line: f.line,
            severity: f.severity,
            comment: f.comment,
            suggestion: f.suggestion,
          })),
        }),
      });

      if (!res.ok) return false;

      mutateReview();
      mutateHistory();
      return true;
    } catch {
      return false;
    }
  }, [activeReview, prNumber, repositoryFullName, activeReviewId, mutateReview, mutateHistory]);

  return {
    activeReview: activeReview ?? null,
    isRunning,
    isCompleted,
    isFailed,
    history: history ?? [],
    isLoadingHistory,
    launch,
    cancel,
    viewReview,
    resetView,
    postSingleFinding,
    postAllFindings,
  };
}
