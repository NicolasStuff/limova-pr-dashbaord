"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";

type AvatarSize = "sm" | "md" | "lg";

interface AvatarProps {
  src?: string | null;
  alt: string;
  size?: AvatarSize;
  statusColor?: string;
  className?: string;
}

const sizeStyles: Record<AvatarSize, string> = {
  sm: "w-6 h-6 text-2xs",
  md: "w-8 h-8 text-xs",
  lg: "w-10 h-10 text-sm",
};

function getInitials(name: string): string {
  if (!name) return "?";
  return name
    .split(/[\s-_]+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function Avatar({ src, alt, size = "md", statusColor, className }: AvatarProps) {
  const [hasError, setHasError] = useState(false);
  const initials = getInitials(alt);

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center rounded-full",
        "bg-bg-elevated border border-border-subtle",
        "overflow-hidden select-none",
        sizeStyles[size],
        className
      )}
      style={
        statusColor
          ? { boxShadow: `0 0 0 2px ${statusColor}` }
          : undefined
      }
    >
      {src && !hasError ? (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          onError={() => setHasError(true)}
        />
      ) : (
        <span className="font-mono font-medium text-text-secondary">
          {initials}
        </span>
      )}
    </span>
  );
}

export { Avatar, type AvatarProps, type AvatarSize };
