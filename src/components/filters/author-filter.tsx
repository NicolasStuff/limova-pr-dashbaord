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

interface AuthorFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export function AuthorFilter({ value, onChange }: AuthorFilterProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data } = useSWR<ContributorsData>("/api/prs/contributors", fetcher);
  const authors = data?.authors ?? [];

  const filtered = search
    ? authors.filter((a) => a.login.toLowerCase().includes(search.toLowerCase()))
    : authors;

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
  const selected = authors.find((a) => a.login === value);

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
              <path d="M10.561 8.073a6.005 6.005 0 00-3.32-5.15 6.016 6.016 0 00-6.55 1.31A6.005 6.005 0 003.2 13.4a6.01 6.01 0 004.212-.04c.08-.03.155-.07.228-.11a.5.5 0 00.15.04l3.1.9a.5.5 0 00.627-.627l-.9-3.1a.5.5 0 00-.04-.15c.04-.073.08-.148.11-.228a6.005 6.005 0 00-.128-2.012zM6.5 1a5.007 5.007 0 014.361 7.442.5.5 0 00-.039.287l.707 2.434-2.434-.707a.5.5 0 00-.287.039A5.007 5.007 0 011.5 6 5.007 5.007 0 016.5 1z" />
            </svg>
            Author
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
              placeholder="Search author..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cn(
                "h-7 w-full rounded-md bg-bg-elevated border border-border px-2.5",
                "text-xs text-text-primary placeholder:text-text-muted font-mono",
                "focus:outline-none focus:border-status-info/50 focus:ring-1 focus:ring-status-info/30"
              )}
            />
          </div>

          {/* Author list */}
          <div className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-xs text-text-muted font-mono">No authors found</div>
            ) : (
              filtered.map((author) => (
                <button
                  key={author.login}
                  onClick={() => handleSelect(author.login)}
                  className={cn(
                    "flex items-center gap-2.5 w-full px-3 py-1.5 text-left transition-colors cursor-pointer",
                    "hover:bg-bg-hover",
                    author.login === value && "bg-status-info/10"
                  )}
                >
                  <Avatar src={author.avatarUrl} alt={author.login} size="sm" />
                  <span className={cn(
                    "text-xs font-mono truncate",
                    author.login === value ? "text-status-info" : "text-text-primary"
                  )}>
                    {author.login}
                  </span>
                  {author.login === value && (
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
