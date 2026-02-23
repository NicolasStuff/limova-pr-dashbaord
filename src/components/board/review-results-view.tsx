"use client";

import { useState, useMemo } from "react";
import type { ReviewResult, ReviewFinding } from "@/types/claude-review";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FindingCard } from "./finding-card";

interface ReviewResultsViewProps {
  result: ReviewResult;
  reviewId?: number;
  onPostSingle: (finding: ReviewFinding) => Promise<boolean>;
  onPostAll: () => Promise<boolean>;
  prUrl?: string;
}

const statusConfig: Record<
  string,
  { label: string; variant: "error" | "warning" | "success"; icon: React.ReactNode }
> = {
  REQUEST_CHANGES: {
    label: "Changes Requested",
    variant: "error",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
        <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  COMMENT: {
    label: "Commentaires",
    variant: "warning",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 5v3.5M8 10.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  APPROVE: {
    label: "Approuvé",
    variant: "success",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
        <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
};

const severityOrder = ["blocking", "major", "minor", "cosmetic"] as const;
const severityLabels: Record<string, string> = {
  blocking: "Bloquant",
  major: "Majeur",
  minor: "Mineur",
  cosmetic: "Cosmétique",
};
const severityColors: Record<string, string> = {
  blocking: "text-status-error",
  major: "text-status-warning",
  minor: "text-status-info",
  cosmetic: "text-text-muted",
};

export function ReviewResultsView({
  result,
  reviewId: _reviewId,
  onPostSingle,
  onPostAll,
  prUrl,
}: ReviewResultsViewProps) {
  const [isPostingAll, setIsPostingAll] = useState(false);
  const [allPosted, setAllPosted] = useState(false);

  const statusInfo = statusConfig[result.status] ?? statusConfig.COMMENT;

  // Group findings by file
  const groupedFindings = useMemo(() => {
    const groups: Record<string, ReviewFinding[]> = {};
    for (const f of result.findings) {
      (groups[f.file] ??= []).push(f);
    }
    // Sort findings within each file by line number
    for (const file of Object.keys(groups)) {
      groups[file].sort((a, b) => a.line - b.line);
    }
    return groups;
  }, [result.findings]);

  // Severity summary
  const severityCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const f of result.findings) {
      counts[f.severity] = (counts[f.severity] ?? 0) + 1;
    }
    return counts;
  }, [result.findings]);

  const postedCount = result.findings.filter((f) => f.posted).length;
  const totalCount = result.findings.length;

  const handlePostAll = async () => {
    setIsPostingAll(true);
    try {
      const ok = await onPostAll();
      if (ok) setAllPosted(true);
    } finally {
      setIsPostingAll(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Status banner */}
      <div
        className={cn(
          "flex items-center gap-3 rounded-lg p-3 border",
          statusInfo.variant === "error" && "bg-status-error/8 border-status-error/20 text-status-error",
          statusInfo.variant === "warning" && "bg-status-warning/8 border-status-warning/20 text-status-warning",
          statusInfo.variant === "success" && "bg-status-success/8 border-status-success/20 text-status-success"
        )}
      >
        {statusInfo.icon}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">{statusInfo.label}</p>
          <p className="text-2xs font-mono opacity-80 mt-0.5">
            {result.filesAnalyzed} fichiers analysés par {result.reviewerCount} reviewer{result.reviewerCount > 1 ? "s" : ""} en {result.iterations} itération{result.iterations > 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Severity summary */}
      {totalCount > 0 && (
        <div className="flex items-center gap-4 text-xs font-mono">
          {severityOrder.map((sev) =>
            severityCounts[sev] ? (
              <span key={sev} className={cn("tabular-nums", severityColors[sev])}>
                {severityCounts[sev]} {severityLabels[sev]}
              </span>
            ) : null
          )}
        </div>
      )}

      {/* Review body */}
      {result.body && (
        <div className="rounded-lg border border-border-subtle bg-bg-surface p-3">
          <p className="text-xs text-text-primary leading-relaxed whitespace-pre-wrap">
            {result.body}
          </p>
        </div>
      )}

      {/* Findings grouped by file */}
      {Object.entries(groupedFindings).map(([file, findings]) => (
        <div key={file} className="rounded-lg border border-border-subtle overflow-hidden">
          {/* File header */}
          <div className="flex items-center gap-2 px-3 py-2 bg-bg-elevated border-b border-border-subtle">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0 text-text-muted">
              <path d="M2 2.5A1.5 1.5 0 013.5 1h5.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V13.5A1.5 1.5 0 0112 15H3.5A1.5 1.5 0 012 13.5v-11z" stroke="currentColor" strokeWidth="1.2" />
            </svg>
            <span className="text-xs font-mono text-text-secondary truncate">{file}</span>
            <Badge variant="default" size="sm" className="ml-auto shrink-0">
              {findings.length}
            </Badge>
          </div>

          {/* Finding cards */}
          <div className="p-2 space-y-2 bg-bg-primary">
            {findings.map((finding) => (
              <FindingCard
                key={finding.id}
                finding={finding}
                onPost={() => onPostSingle(finding)}
              />
            ))}
          </div>
        </div>
      ))}

      {/* No findings */}
      {totalCount === 0 && (
        <div className="text-center py-6">
          <p className="text-sm text-text-muted font-mono">Aucun problème trouvé</p>
        </div>
      )}

      {/* Footer: post all */}
      {totalCount > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-border-subtle bg-bg-surface p-3">
          <span className="text-xs font-mono text-text-muted">
            {postedCount}/{totalCount} commentaires postés
          </span>

          {allPosted ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-mono text-status-success">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0">
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Review postée
              {prUrl && (
                <a
                  href={prUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-status-info hover:underline ml-1"
                >
                  Voir sur GitHub
                </a>
              )}
            </span>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={handlePostAll}
              disabled={isPostingAll || postedCount === totalCount}
            >
              {isPostingAll ? (
                <>
                  <span className="h-3 w-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  Envoi…
                </>
              ) : (
                "Tout poster sur GitHub"
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
