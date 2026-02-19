"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils/cn";

interface LabelFilterProps {
  value: string[];
  onChange: (value: string[]) => void;
}

export function LabelFilter({ value, onChange }: LabelFilterProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open, handleClickOutside]);

  function toggle(label: string) {
    if (value.includes(label)) {
      onChange(value.filter((v) => v !== label));
    } else {
      onChange([...value, label]);
    }
  }

  function addCustom() {
    const trimmed = input.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInput("");
  }

  function removeLabel(label: string) {
    onChange(value.filter((v) => v !== label));
  }

  const selectedCount = value.length;

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-mono",
          "border transition-colors duration-150 cursor-pointer",
          selectedCount > 0
            ? "border-status-info/40 bg-status-info/10 text-status-info"
            : "border-border bg-bg-elevated text-text-secondary hover:border-border-strong"
        )}
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" className="shrink-0">
          <path d="M2.5 7.775V2.75a.25.25 0 01.25-.25h5.025a.25.25 0 01.177.073l6.25 6.25a.25.25 0 010 .354l-5.025 5.025a.25.25 0 01-.354 0l-6.25-6.25a.25.25 0 01-.073-.177zm-1.5 0V2.75C1 1.784 1.784 1 2.75 1h5.025c.464 0 .91.184 1.238.513l6.25 6.25a1.75 1.75 0 010 2.474l-5.026 5.026a1.75 1.75 0 01-2.474 0l-6.25-6.25A1.75 1.75 0 011 7.775zM6 5a1 1 0 100 2 1 1 0 000-2z" />
        </svg>
        Labels
        {selectedCount > 0 && (
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-status-info text-text-inverse text-2xs font-semibold px-1">
            {selectedCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-full left-0 z-50 mt-1 w-56 rounded-md border border-border bg-bg-surface shadow-card animate-fade-in">
          <div className="p-2">
            <input
              type="text"
              placeholder="Add label..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustom();
                }
              }}
              className={cn(
                "h-7 w-full rounded-md bg-bg-elevated border border-border px-2.5",
                "text-xs text-text-primary placeholder:text-text-muted font-mono",
                "focus:outline-none focus:border-status-info/50 focus:ring-1 focus:ring-status-info/30"
              )}
              autoFocus
            />
          </div>

          {value.length > 0 && (
            <div className="flex flex-wrap gap-1 px-3 pb-2">
              {value.map((label) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1 rounded bg-status-info/10 border border-status-info/25 px-1.5 py-0.5 text-2xs font-mono text-status-info"
                >
                  {label}
                  <button
                    onClick={() => removeLabel(label)}
                    aria-label={`Remove label ${label}`}
                    className="text-status-info/60 hover:text-status-info transition-colors cursor-pointer"
                  >
                    <svg width="8" height="8" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 3l6 6M9 3l-6 6" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}

          {value.length > 0 && (
            <div className="border-t border-border-subtle px-2 py-1.5">
              <button
                onClick={() => { onChange([]); setOpen(false); }}
                className="w-full rounded px-2 py-1 text-left text-2xs font-mono text-text-muted hover:text-status-error hover:bg-bg-hover transition-colors cursor-pointer"
              >
                Clear all labels
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
