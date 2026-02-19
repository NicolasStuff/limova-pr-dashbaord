"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import useSWR from "swr";
import { cn } from "@/lib/utils/cn";
import type { Repository } from "@/types/repository";

interface RepoFilterProps {
  value: number[];
  onChange: (value: number[]) => void;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function RepoFilter({ value, onChange }: RepoFilterProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { data } = useSWR<{ repositories: Repository[] }>("/api/repositories", fetcher);
  const repos = data?.repositories;

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

  function toggle(id: number) {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      onChange([...value, id]);
    }
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
          <path d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 010-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9z" />
        </svg>
        Repo
        {selectedCount > 0 && (
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-status-info text-text-inverse text-2xs font-semibold px-1">
            {selectedCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-full left-0 z-50 mt-1 w-56 rounded-md border border-border bg-bg-surface shadow-card animate-fade-in">
          <div className="max-h-48 overflow-y-auto p-1">
            {!repos || repos.length === 0 ? (
              <p className="px-3 py-2 text-xs text-text-muted">No repositories</p>
            ) : (
              repos.map((repo) => {
                const selected = value.includes(repo.id);
                return (
                  <button
                    key={repo.id}
                    onClick={() => toggle(repo.id)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-xs font-mono",
                      "transition-colors cursor-pointer",
                      selected
                        ? "bg-status-info/10 text-status-info"
                        : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
                    )}
                  >
                    <span className={cn(
                      "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm border",
                      selected ? "border-status-info bg-status-info" : "border-border-strong"
                    )}>
                      {selected && (
                        <svg width="8" height="8" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2">
                          <path d="M2 6l3 3 5-5" />
                        </svg>
                      )}
                    </span>
                    <span className="truncate">{repo.fullName}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
