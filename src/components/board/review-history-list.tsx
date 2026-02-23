"use client";

import type { ReviewHistoryItem, ClaudeReviewDbStatus } from "@/types/claude-review";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface ReviewHistoryListProps {
  history: ReviewHistoryItem[];
  onSelect: (reviewId: number) => void;
  activeReviewId?: number | null;
}

const statusConfig: Record<
  ClaudeReviewDbStatus,
  { label: string; variant: "success" | "error" | "warning" | "info" | "default" }
> = {
  pending: { label: "En attente", variant: "info" },
  running: { label: "En cours", variant: "info" },
  completed: { label: "Termine", variant: "success" },
  failed: { label: "Echoue", variant: "error" },
  cancelled: { label: "Annule", variant: "warning" },
};

export function ReviewHistoryList({ history, onSelect, activeReviewId }: ReviewHistoryListProps) {
  if (history.length === 0) {
    return null;
  }

  return (
    <div>
      <h4 className="text-2xs font-mono text-text-muted uppercase tracking-wider mb-2">
        Historique des reviews
      </h4>
      <div className="space-y-1.5">
        {history.map((item) => {
          const config = statusConfig[item.status];
          const isActive = activeReviewId === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`w-full flex items-center gap-2.5 rounded-md border px-3 py-2 text-left transition-all cursor-pointer ${
                isActive
                  ? "border-status-info/30 bg-status-info/5"
                  : "border-border-subtle bg-bg-surface hover:bg-bg-hover"
              }`}
            >
              <Badge variant={config.variant} size="sm">
                {config.label}
              </Badge>
              <span className="text-2xs font-mono text-text-muted uppercase">
                {item.scope}
              </span>
              {item.totalFindings > 0 && (
                <span className="text-2xs font-mono text-text-secondary tabular-nums">
                  {item.totalFindings} finding{item.totalFindings > 1 ? "s" : ""}
                </span>
              )}
              {item.postedToGithub && (
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="shrink-0 text-status-success">
                  <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              <span className="text-2xs font-mono text-text-muted ml-auto shrink-0">
                {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
