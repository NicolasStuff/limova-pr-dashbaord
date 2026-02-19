import { cn } from "@/lib/utils/cn";
import type { HTMLAttributes } from "react";

type BadgeVariant =
  | "default"
  | "draft"
  | "ready"
  | "in-progress"
  | "changes"
  | "approved"
  | "merged"
  | "success"
  | "warning"
  | "error"
  | "info";

type BadgeSize = "sm" | "md";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-bg-elevated text-text-secondary border-border",
  draft: "bg-column-draft/15 text-column-draft border-column-draft/25",
  ready: "bg-column-ready/15 text-column-ready border-column-ready/25",
  "in-progress": "bg-column-in-progress/15 text-column-in-progress border-column-in-progress/25",
  changes: "bg-column-changes/15 text-column-changes border-column-changes/25",
  approved: "bg-column-approved/15 text-column-approved border-column-approved/25",
  merged: "bg-column-merged/15 text-column-merged border-column-merged/25",
  success: "bg-status-success/15 text-status-success border-status-success/25",
  warning: "bg-status-warning/15 text-status-warning border-status-warning/25",
  error: "bg-status-error/15 text-status-error border-status-error/25",
  info: "bg-status-info/15 text-status-info border-status-info/25",
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "px-1.5 py-0.5 text-2xs",
  md: "px-2 py-0.5 text-xs",
};

function Badge({ className, variant = "default", size = "sm", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded font-mono font-medium uppercase tracking-wider",
        "border transition-colors duration-150",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    />
  );
}

export { Badge, type BadgeProps, type BadgeVariant, type BadgeSize };
