"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-status-info text-white hover:bg-blue-400 shadow-glow-sm hover:shadow-glow-md active:bg-blue-600",
  secondary:
    "bg-bg-surface text-text-primary border border-border hover:bg-bg-hover hover:border-border-strong active:bg-bg-elevated",
  danger:
    "bg-status-error/10 text-status-error border border-status-error/20 hover:bg-status-error/20 hover:border-status-error/40 active:bg-status-error/30",
  ghost:
    "bg-transparent text-text-secondary hover:text-text-primary hover:bg-bg-hover active:bg-bg-elevated",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-7 px-2.5 text-xs gap-1.5",
  md: "h-9 px-3.5 text-sm gap-2",
  lg: "h-11 px-5 text-base gap-2.5",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "secondary", size = "md", disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium font-sans",
          "transition-all duration-150 ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-info/50 focus-visible:ring-offset-1 focus-visible:ring-offset-bg-primary",
          "disabled:pointer-events-none disabled:opacity-40",
          "cursor-pointer select-none",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button, type ButtonProps, type ButtonVariant, type ButtonSize };
