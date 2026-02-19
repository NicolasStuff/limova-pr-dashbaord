import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type CardAccent = "draft" | "ready" | "in-progress" | "changes" | "approved" | "merged";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  accent?: CardAccent;
}

const accentStyles: Record<CardAccent, string> = {
  draft: "border-l-3 border-l-column-draft",
  ready: "border-l-3 border-l-column-ready",
  "in-progress": "border-l-3 border-l-column-in-progress",
  changes: "border-l-3 border-l-column-changes",
  approved: "border-l-3 border-l-column-approved",
  merged: "border-l-3 border-l-column-merged",
};

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, accent, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg bg-bg-surface border border-border-subtle",
          "shadow-card transition-all duration-200 ease-out",
          "hover:shadow-card-hover hover:border-border",
          accent && accentStyles[accent],
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = "Card";

const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("px-3.5 py-3 border-b border-border-subtle", className)}
      {...props}
    />
  )
);

CardHeader.displayName = "CardHeader";

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("px-3.5 py-3", className)}
      {...props}
    />
  )
);

CardContent.displayName = "CardContent";

export { Card, CardHeader, CardContent, type CardProps, type CardAccent };
