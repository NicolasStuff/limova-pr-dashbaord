"use client";

import useSWR from "swr";
import { cn } from "@/lib/utils/cn";
import { Tooltip } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

interface CheckRun {
  name: string;
  status: string;
  conclusion: string | null;
  detailsUrl: string | null;
  startedAt: string | null;
  completedAt: string | null;
}

interface CheckSuite {
  app: { name: string; logoUrl: string | null } | null;
  status: string;
  conclusion: string | null;
  checkRuns: CheckRun[];
}

interface PrChecksResult {
  overallStatus: string | null;
  checkSuites: CheckSuite[];
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  pendingChecks: number;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function CheckIcon({ conclusion, status }: { conclusion: string | null; status: string }) {
  if (conclusion === "SUCCESS" || conclusion === "NEUTRAL" || conclusion === "SKIPPED") {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0 text-status-success">
        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
        <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (conclusion === "FAILURE" || conclusion === "TIMED_OUT" || conclusion === "CANCELLED") {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0 text-status-error">
        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
        <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  if (conclusion === "ACTION_REQUIRED") {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0 text-status-warning">
        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 5v3.5M8 10.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  // Pending / In progress
  return (
    <span className="relative shrink-0 flex h-3.5 w-3.5 items-center justify-center">
      <span className="absolute inline-flex h-full w-full rounded-full bg-status-warning/30 ci-pulse" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-status-warning" />
    </span>
  );
}

function OverallStatusBanner({ data }: { data: PrChecksResult }) {
  const isSuccess = data.overallStatus === "SUCCESS" || (data.failedChecks === 0 && data.pendingChecks === 0 && data.totalChecks > 0);
  const isFailure = data.failedChecks > 0;
  const isPending = data.pendingChecks > 0 && data.failedChecks === 0;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg p-3 border",
        isSuccess && "bg-status-success/8 border-status-success/20",
        isFailure && "bg-status-error/8 border-status-error/20",
        isPending && "bg-status-warning/8 border-status-warning/20",
        !isSuccess && !isFailure && !isPending && "bg-bg-surface border-border-subtle"
      )}
    >
      {/* Big status icon */}
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
          isSuccess && "bg-status-success/15",
          isFailure && "bg-status-error/15",
          isPending && "bg-status-warning/15",
          !isSuccess && !isFailure && !isPending && "bg-bg-elevated"
        )}
      >
        {isSuccess && (
          <svg width="20" height="20" viewBox="0 0 16 16" fill="none" className="text-status-success">
            <path d="M3.5 8l3 3 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
        {isFailure && (
          <svg width="20" height="20" viewBox="0 0 16 16" fill="none" className="text-status-error">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )}
        {isPending && (
          <svg width="20" height="20" viewBox="0 0 16 16" fill="none" className="text-status-warning ci-pulse">
            <circle cx="8" cy="8" r="3" fill="currentColor" />
          </svg>
        )}
        {!isSuccess && !isFailure && !isPending && (
          <svg width="20" height="20" viewBox="0 0 16 16" fill="none" className="text-text-muted">
            <circle cx="8" cy="8" r="5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
          </svg>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm font-semibold",
            isSuccess && "text-status-success",
            isFailure && "text-status-error",
            isPending && "text-status-warning",
            !isSuccess && !isFailure && !isPending && "text-text-muted"
          )}
        >
          {isSuccess && "All checks passed"}
          {isFailure && `${data.failedChecks} check${data.failedChecks > 1 ? "s" : ""} failed`}
          {isPending && `${data.pendingChecks} check${data.pendingChecks > 1 ? "s" : ""} in progress`}
          {!isSuccess && !isFailure && !isPending && "No checks"}
        </p>
        <p className="text-2xs font-mono text-text-muted mt-0.5">
          {data.totalChecks > 0
            ? `${data.passedChecks}/${data.totalChecks} passed`
            : "No CI checks configured"}
        </p>
      </div>

      {/* Progress bar */}
      {data.totalChecks > 0 && (
        <div className="flex h-1.5 w-20 overflow-hidden rounded-full bg-bg-elevated shrink-0">
          {data.passedChecks > 0 && (
            <div
              className="bg-status-success transition-all duration-500"
              style={{ width: `${(data.passedChecks / data.totalChecks) * 100}%` }}
            />
          )}
          {data.failedChecks > 0 && (
            <div
              className="bg-status-error transition-all duration-500"
              style={{ width: `${(data.failedChecks / data.totalChecks) * 100}%` }}
            />
          )}
          {data.pendingChecks > 0 && (
            <div
              className="bg-status-warning ci-pulse transition-all duration-500"
              style={{ width: `${(data.pendingChecks / data.totalChecks) * 100}%` }}
            />
          )}
        </div>
      )}
    </div>
  );
}

function CheckRunRow({ check }: { check: CheckRun }) {
  const isSuccess = check.conclusion === "SUCCESS" || check.conclusion === "NEUTRAL" || check.conclusion === "SKIPPED";
  const isFailed = check.conclusion === "FAILURE" || check.conclusion === "TIMED_OUT" || check.conclusion === "CANCELLED";

  const duration =
    check.startedAt && check.completedAt
      ? formatDuration(new Date(check.startedAt), new Date(check.completedAt))
      : null;

  const content = (
    <div
      className={cn(
        "flex items-center gap-2.5 py-1.5 px-2 rounded-md transition-colors duration-150",
        "hover:bg-bg-hover group",
        isFailed && "bg-status-error/5"
      )}
    >
      <CheckIcon conclusion={check.conclusion} status={check.status} />

      <span
        className={cn(
          "flex-1 text-xs font-mono truncate",
          isSuccess && "text-text-secondary",
          isFailed && "text-status-error",
          !isSuccess && !isFailed && "text-text-muted"
        )}
      >
        {check.name}
      </span>

      {duration && (
        <span className="text-2xs font-mono text-text-muted tabular-nums shrink-0">
          {duration}
        </span>
      )}

      {check.detailsUrl && (
        <a
          href={check.detailsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-2xs text-text-muted hover:text-status-info opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 9v4a1 1 0 01-1 1H3a1 1 0 01-1-1V5a1 1 0 011-1h4" />
            <path d="M9 2h5v5" />
            <path d="M6 10L14 2" />
          </svg>
        </a>
      )}
    </div>
  );

  return content;
}

function formatDuration(start: Date, end: Date): string {
  const ms = end.getTime() - start.getTime();
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-16 w-full rounded-lg" />
      <div className="space-y-1">
        <Skeleton className="h-7 w-full rounded-md" />
        <Skeleton className="h-7 w-full rounded-md" />
        <Skeleton className="h-7 w-3/4 rounded-md" />
      </div>
    </div>
  );
}

export function CiStatusPanel({ prId }: { prId: number }) {
  const { data, error, isLoading } = useSWR<PrChecksResult>(
    `/api/prs/${prId}/checks`,
    fetcher,
    { refreshInterval: 30000, revalidateOnFocus: true }
  );

  return (
    <div>
      <h3 className="text-2xs font-mono text-text-muted uppercase tracking-wider mb-2.5">
        CI / Checks
      </h3>

      {isLoading && <LoadingSkeleton />}

      {error && (
        <div className="rounded-lg border border-status-error/20 bg-status-error/5 p-3 text-xs text-status-error">
          Failed to load CI checks
        </div>
      )}

      {data && (
        <div className="space-y-2.5">
          <OverallStatusBanner data={data} />

          {/* Individual check runs grouped by suite */}
          {data.checkSuites.map((suite, suiteIndex) => (
            <div key={suiteIndex} className="rounded-lg border border-border-subtle bg-bg-surface overflow-hidden">
              {/* Suite header */}
              {suite.app && (
                <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border-subtle bg-bg-elevated/50">
                  {suite.app.logoUrl && (
                    <img
                      src={suite.app.logoUrl}
                      alt={suite.app.name}
                      className="h-3.5 w-3.5 rounded-sm"
                    />
                  )}
                  <span className="text-2xs font-mono text-text-muted uppercase tracking-wider">
                    {suite.app.name}
                  </span>
                </div>
              )}

              {/* Check runs */}
              <div className="px-1 py-1">
                {suite.checkRuns.map((check, checkIndex) => (
                  <CheckRunRow key={checkIndex} check={check} />
                ))}
              </div>
            </div>
          ))}

          {data.totalChecks === 0 && (
            <div className="text-xs font-mono text-text-muted text-center py-3">
              No CI checks configured for this PR
            </div>
          )}
        </div>
      )}
    </div>
  );
}
