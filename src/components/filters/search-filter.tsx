"use client";

import { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils/cn";

interface SearchFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchFilter({ value, onChange }: SearchFilterProps) {
  const [localValue, setLocalValue] = useState(value);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  function handleChange(v: string) {
    setLocalValue(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onChange(v), 300);
  }

  return (
    <div className="relative flex items-center">
      <svg
        width="14"
        height="14"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="absolute left-2.5 text-text-muted pointer-events-none"
      >
        <circle cx="7" cy="7" r="5" />
        <line x1="11" y1="11" x2="14" y2="14" />
      </svg>
      <input
        type="text"
        placeholder="Search PRs..."
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        className={cn(
          "h-7 w-48 rounded-md bg-bg-elevated border border-border pl-8 pr-2",
          "text-xs text-text-primary placeholder:text-text-muted font-mono",
          "transition-colors duration-150",
          "focus:outline-none focus:border-status-info/50 focus:ring-1 focus:ring-status-info/30"
        )}
      />
    </div>
  );
}
