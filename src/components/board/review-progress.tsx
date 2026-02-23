"use client";

import { useState, useRef, useEffect } from "react";
import type { ClaudeReviewStatus, StructuredLogEntry } from "@/types/claude-review";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

interface ReviewProgressProps {
  review: ClaudeReviewStatus;
}

const phaseLabels: Record<string, string> = {
  preparation: "Preparation du diff...",
  spawning_reviewers: "Lancement des reviewers...",
  running_review: "Review en cours...",
  collecting_findings: "Collecte des findings...",
  completed: "Termine",
  cancelled: "Annule",
  error: "Erreur",
};

function LogTimeline({ entries }: { entries: StructuredLogEntry[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [entries.length]);

  return (
    <div
      ref={containerRef}
      className="h-40 overflow-y-auto rounded-md border border-border-subtle bg-bg-primary p-3 space-y-1.5"
    >
      {entries.length === 0 && (
        <p className="text-2xs font-mono text-text-muted">En attente du demarrage...</p>
      )}
      {entries.map((entry, i) => {
        const time = new Date(entry.ts);
        const timeStr = `${time.getHours().toString().padStart(2, "0")}:${time.getMinutes().toString().padStart(2, "0")}:${time.getSeconds().toString().padStart(2, "0")}`;

        return (
          <div key={i} className="flex items-start gap-2 text-2xs font-mono">
            <span className="text-text-muted shrink-0 tabular-nums">{timeStr}</span>
            <span className="text-text-secondary">{entry.message}</span>
          </div>
        );
      })}
    </div>
  );
}

function RawOutput({ output }: { output: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const lineCount = output ? output.split("\n").length : 0;

  useEffect(() => {
    if (isOpen) {
      const el = containerRef.current;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    }
  }, [output, isOpen]);

  return (
    <div className="rounded-md border border-border-subtle overflow-hidden">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-2 text-left transition-colors cursor-pointer",
          "bg-bg-elevated hover:bg-bg-hover"
        )}
      >
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          className={cn(
            "shrink-0 text-text-muted transition-transform duration-150",
            isOpen && "rotate-90"
          )}
        >
          <path d="M3 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-2xs font-mono text-text-muted">Raw output</span>
        {lineCount > 0 && (
          <span className="text-2xs font-mono text-text-muted tabular-nums ml-auto">
            {lineCount} lignes
          </span>
        )}
      </button>

      {isOpen && (
        <div
          ref={containerRef}
          className="h-64 overflow-y-auto bg-bg-primary p-3 font-mono text-2xs text-text-secondary leading-relaxed whitespace-pre-wrap break-all border-t border-border-subtle"
        >
          {output || "Aucune sortie pour le moment..."}
        </div>
      )}
    </div>
  );
}

export function ReviewProgress({ review }: ReviewProgressProps) {
  const phaseText = review.currentPhase
    ? phaseLabels[review.currentPhase] ?? review.currentPhase
    : "Demarrage...";

  const iterationText =
    review.currentIteration > 0
      ? `Iteration ${review.currentIteration}/${review.maxIterations}`
      : "";

  return (
    <div className="space-y-3">
      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-2xs font-mono text-text-muted">
          <span>{iterationText}</span>
          <span className="tabular-nums">{review.progressPct}%</span>
        </div>
        <div className="h-2 rounded-full bg-bg-surface border border-border-subtle overflow-hidden">
          <div
            className="h-full rounded-full bg-status-info transition-all duration-500 ease-out"
            style={{ width: `${review.progressPct}%` }}
          />
        </div>
      </div>

      {/* Phase + findings badge */}
      <div className="flex items-center gap-3">
        <span className="relative flex items-center gap-1.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-status-info/30 animate-ping" />
          <Badge variant="info" size="sm" className="relative">
            {phaseText}
          </Badge>
        </span>
        {review.totalFindings > 0 && (
          <span className="text-xs font-mono text-text-secondary tabular-nums">
            {review.totalFindings} finding{review.totalFindings > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Structured log timeline */}
      <LogTimeline entries={review.structuredLog} />

      {/* Raw output — collapsible */}
      <RawOutput output={review.rawOutput} />
    </div>
  );
}
