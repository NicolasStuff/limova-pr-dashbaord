"use client";

import { useState } from "react";
import type { ReviewFinding } from "@/types/claude-review";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface FindingCardProps {
  finding: ReviewFinding;
  onPost: () => Promise<boolean>;
}

const severityConfig: Record<
  string,
  { label: string; variant: "error" | "warning" | "info" | "default"; ring: string }
> = {
  blocking: { label: "Bloquant", variant: "error", ring: "border-status-error/30" },
  major: { label: "Majeur", variant: "warning", ring: "border-status-warning/30" },
  minor: { label: "Mineur", variant: "info", ring: "border-status-info/30" },
  cosmetic: { label: "Cosmétique", variant: "default", ring: "border-border-subtle" },
};

function DiffBlock({ diff }: { diff: string }) {
  const lines = diff.split("\n");

  return (
    <div className="rounded-md border border-border-subtle bg-bg-primary overflow-hidden text-2xs font-mono leading-relaxed">
      {lines.map((line, i) => {
        const isAdd = line.startsWith("+") && !line.startsWith("+++");
        const isDel = line.startsWith("-") && !line.startsWith("---");
        const isHunk = line.startsWith("@@");

        return (
          <div
            key={i}
            className={cn(
              "px-3 py-px whitespace-pre-wrap break-all",
              isAdd && "bg-status-success/8 text-status-success",
              isDel && "bg-status-error/8 text-status-error",
              isHunk && "bg-bg-elevated text-text-muted",
              !isAdd && !isDel && !isHunk && "text-text-secondary"
            )}
          >
            {line || "\u00A0"}
          </div>
        );
      })}
    </div>
  );
}

export function FindingCard({ finding, onPost }: FindingCardProps) {
  const [isPosting, setIsPosting] = useState(false);
  const config = severityConfig[finding.severity] ?? severityConfig.cosmetic;

  const handlePost = async () => {
    setIsPosting(true);
    try {
      await onPost();
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div
      className={cn(
        "rounded-lg border bg-bg-surface overflow-hidden transition-colors",
        config.ring
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border-subtle bg-bg-elevated/50">
        <span className="text-xs font-mono text-text-secondary">
          Ligne {finding.line}
        </span>
        <Badge variant={config.variant} size="sm">
          {config.label}
        </Badge>
        {finding.iteration > 1 && (
          <span className="text-2xs font-mono text-text-muted ml-auto">
            itération {finding.iteration}
          </span>
        )}
      </div>

      <div className="p-3 space-y-3">
        {/* Diff context */}
        {finding.diffContext && <DiffBlock diff={finding.diffContext} />}

        {/* Comment */}
        <div className="text-xs text-text-primary leading-relaxed whitespace-pre-wrap">
          {finding.comment}
        </div>

        {/* Suggestion */}
        {finding.suggestion && (
          <div>
            <p className="text-2xs font-mono text-text-muted uppercase tracking-wider mb-1">
              Suggestion
            </p>
            <div className="rounded-md border border-border-subtle bg-bg-primary p-2.5">
              <pre className="text-2xs font-mono text-status-info whitespace-pre-wrap break-all leading-relaxed">
                {finding.suggestion}
              </pre>
            </div>
          </div>
        )}

        {/* Post button */}
        <div className="flex items-center justify-end pt-1">
          {finding.posted ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-mono text-status-success">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0">
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Posté
            </span>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePost}
              disabled={isPosting}
            >
              {isPosting ? (
                <>
                  <span className="h-3 w-3 rounded-full border-2 border-text-muted border-t-transparent animate-spin" />
                  Envoi…
                </>
              ) : (
                "Poster ce commentaire"
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
