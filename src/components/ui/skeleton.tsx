import { cn } from "@/lib/utils/cn";
import type { HTMLAttributes } from "react";

function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-md bg-bg-elevated animate-pulse-slow",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
