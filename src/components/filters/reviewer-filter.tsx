"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import useSWR from "swr";
import { cn } from "@/lib/utils/cn";
import { Avatar } from "@/components/ui/avatar";

interface Contributor {
  login: string;
  avatarUrl: string | null;
}

interface ContributorsData {
  authors: Contributor[];
  reviewers: Contributor[];
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface ReviewerFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export function ReviewerFilter({ value, onChange }: ReviewerFilterProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data } = useSWR<ContributorsData>("/api/prs/contributors", fetcher);
  const reviewers = data?.reviewers ?? [];

  const filtered = search
    ? reviewers.filter((r) => r.login.toLowerCase().includes(search.toLowerCase()))
    : reviewers;

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      setOpen(false);
      setSearch("");
    }
  }, []);

  useEffect(() => {
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open, handleClickOutside]);

  function handleSelect(login: string) {
    onChange(login === value ? "" : login);
    setOpen(false);
    setSearch("");
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange("");
    setOpen(false);
    setSearch("");
  }

  const hasValue = value.length > 0;
  const selected = reviewers.find((r) => r.login === value);

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-mono",
          "border transition-colors duration-150 cursor-pointer",
          hasValue
            ? "border-status-info/40 bg-status-info/10 text-status-info"
            : "border-border bg-bg-elevated text-text-secondary hover:border-border-strong"
        )}
      >
        {selected ? (
          <>
            <Avatar src={selected.avatarUrl} alt={selected.login} size="sm" className="!w-4 !h-4 !text-[8px]" />
            <span className="max-w-[80px] truncate">{selected.login}</span>
            <span
              onClick={handleClear}
              className="ml-0.5 hover:text-text-primary transition-colors"
            >
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="4" y1="4" x2="12" y2="12" />
                <line x1="12" y1="4" x2="4" y2="12" />
              </svg>
            </span>
          </>
        ) : (
          <>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" className="shrink-0">
              <path d="M2 5.5a3.5 3.5 0 115.898 2.549 5.507 5.507 0 013.034 4.084.75.75 0 11-1.482.235 4.001 4.001 0 00-7.9 0 .75.75 0 01-1.482-.236A5.507 5.507 0 013.102 8.05 3.49 3.49 0 012 5.5zM11 4a.75.75 0 100 1.5 1.5 1.5 0 01.666 2.844.75.75 0 00-.416.672v.352a.75.75 0 00.574.73c1.2.289 2.162 1.2 2.522 2.372a.75.75 0 101.434-.44 5.01 5.01 0 00-2.56-3.012A3 3 0 0011 4zM5.5 4a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" />
            </svg>
            Reviewer
          </>
        )}
      </button>

      {open && (
        <div className="absolute top-full left-0 z-50 mt-1 w-56 rounded-md border border-border bg-bg-surface shadow-card animate-fade-in overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-border-subtle">
            <input
              ref={inputRef}
              type="text"
              placeholder="Search reviewer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cn(
                "h-7 w-full rounded-md bg-bg-elevated border border-border px-2.5",
                "text-xs text-text-primary placeholder:text-text-muted font-mono",
                "focus:outline-none focus:border-status-info/50 focus:ring-1 focus:ring-status-info/30"
              )}
            />
          </div>

          {/* Reviewer list */}
          <div className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-xs text-text-muted font-mono">No reviewers found</div>
            ) : (
              filtered.map((reviewer) => (
                <button
                  key={reviewer.login}
                  onClick={() => handleSelect(reviewer.login)}
                  className={cn(
                    "flex items-center gap-2.5 w-full px-3 py-1.5 text-left transition-colors cursor-pointer",
                    "hover:bg-bg-hover",
                    reviewer.login === value && "bg-status-info/10"
                  )}
                >
                  <Avatar src={reviewer.avatarUrl} alt={reviewer.login} size="sm" />
                  <span className={cn(
                    "text-xs font-mono truncate",
                    reviewer.login === value ? "text-status-info" : "text-text-primary"
                  )}>
                    {reviewer.login}
                  </span>
                  {reviewer.login === value && (
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-auto shrink-0 text-status-info">
                      <path d="M3.5 8l3 3 6-6" />
                    </svg>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
