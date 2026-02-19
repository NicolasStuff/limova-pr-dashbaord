import type { PrColumn } from "@/types/pr";

export interface ColumnDefinition {
  key: PrColumn;
  label: string;
  color: string;
  order: number;
}

export const COLUMNS: Record<PrColumn, ColumnDefinition> = {
  draft: {
    key: "draft",
    label: "Draft",
    color: "#6b7280",
    order: 0,
  },
  ready_for_review: {
    key: "ready_for_review",
    label: "Ready for Review",
    color: "#3b82f6",
    order: 1,
  },
  review_in_progress: {
    key: "review_in_progress",
    label: "Review in Progress",
    color: "#f59e0b",
    order: 2,
  },
  changes_requested: {
    key: "changes_requested",
    label: "Changes Requested",
    color: "#ef4444",
    order: 3,
  },
  approved: {
    key: "approved",
    label: "Approved",
    color: "#22c55e",
    order: 4,
  },
  merged: {
    key: "merged",
    label: "Merged",
    color: "#a855f7",
    order: 5,
  },
};

export const COLUMN_ORDER: PrColumn[] = [
  "draft",
  "ready_for_review",
  "review_in_progress",
  "changes_requested",
  "approved",
  "merged",
];

export const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
export const MERGED_PR_RETENTION_DAYS = 7;
