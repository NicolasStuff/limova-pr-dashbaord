"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useClaudeReview } from "@/lib/hooks/use-claude-review";
import { useUserSettings } from "@/lib/hooks/use-user-settings";
import { ReviewResultsView } from "./review-results-view";
import { ReviewProgress } from "./review-progress";
import { ReviewHistoryList } from "./review-history-list";

interface ClaudeReviewPanelProps {
  prNumber: number;
  repositoryFullName: string;
  pullRequestId: number;
}

function resolveScope(repositoryFullName: string): "api" | "client" {
  const repoName = repositoryFullName.split("/").pop()?.toLowerCase() ?? "";
  if (repoName.includes("client")) return "client";
  return "api";
}

function RepoPathConfig({
  currentPath,
  onSave,
}: {
  currentPath: string | null;
  onSave: (path: string) => Promise<void>;
}) {
  const [isEditing, setIsEditing] = useState(!currentPath);
  const [value, setValue] = useState(currentPath ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [isBrowsing, setIsBrowsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBrowse = async () => {
    setIsBrowsing(true);
    setError(null);
    try {
      const res = await fetch("/api/browse-directory", { method: "POST" });
      const data = await res.json();
      if (data.path) {
        setValue(data.path);
      }
    } catch {
      setError("Impossible d'ouvrir le selecteur de dossier");
    } finally {
      setIsBrowsing(false);
    }
  };

  const handleSave = async () => {
    const trimmed = value.trim();
    if (!trimmed) {
      setError("Le chemin ne peut pas etre vide");
      return;
    }
    if (!trimmed.startsWith("/")) {
      setError("Le chemin doit etre absolu (commencer par /)");
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await onSave(trimmed);
      setIsEditing(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isEditing && currentPath) {
    return (
      <div className="flex items-center gap-2 rounded-md bg-bg-surface border border-border-subtle px-3 py-2">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0 text-text-muted">
          <path d="M1.5 3.5a1 1 0 011-1h4l1.5 1.5h5a1 1 0 011 1v7a1 1 0 01-1 1h-11a1 1 0 01-1-1v-8.5z" stroke="currentColor" strokeWidth="1.2" />
        </svg>
        <span className="text-xs font-mono text-text-secondary truncate flex-1">
          {currentPath}
        </span>
        <button
          onClick={() => {
            setValue(currentPath);
            setIsEditing(true);
          }}
          className="text-text-muted hover:text-text-primary transition-colors cursor-pointer shrink-0"
          aria-label="Modifier le chemin"
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11.5 1.5l3 3-9 9H2.5v-3l9-9z" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="/Users/you/projects/limova"
          className="flex-1 h-8 px-2.5 text-xs font-mono rounded-md border border-border bg-bg-primary text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-status-info/50 focus:border-status-info/50"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
          }}
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBrowse}
          disabled={isBrowsing}
          title="Parcourir"
        >
          {isBrowsing ? (
            <svg width="14" height="14" viewBox="0 0 16 16" className="animate-spin">
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeDasharray="28" strokeDashoffset="8" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
              <path d="M1.5 3.5a1 1 0 011-1h4l1.5 1.5h5a1 1 0 011 1v7a1 1 0 01-1 1h-11a1 1 0 01-1-1v-8.5z" />
            </svg>
          )}
        </Button>
        <Button variant="primary" size="sm" onClick={handleSave} disabled={isSaving}>
          {isSaving ? "..." : "Sauvegarder"}
        </Button>
        {currentPath && (
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
            Annuler
          </Button>
        )}
      </div>
      {error && (
        <p className="text-2xs text-status-error font-mono">{error}</p>
      )}
    </div>
  );
}

export function ClaudeReviewPanel({
  prNumber,
  repositoryFullName,
  pullRequestId,
}: ClaudeReviewPanelProps) {
  const { settings, isLoading: settingsLoading, updateRepoPath } = useUserSettings();
  const {
    activeReview,
    isRunning,
    isCompleted,
    isFailed,
    history,
    isLoadingHistory,
    launch,
    cancel,
    viewReview,
    resetView,
    postSingleFinding,
    postAllFindings,
  } = useClaudeReview(prNumber, repositoryFullName, pullRequestId);

  const [reviewerCount, setReviewerCount] = useState<"auto" | number>("auto");
  const [dryRun, setDryRun] = useState(true);
  const [verifyImplementation, setVerifyImplementation] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);

  const scope = resolveScope(repositoryFullName);
  const canLaunch = !activeReview || isCompleted || isFailed;

  const handleLaunch = useCallback(async () => {
    setLaunchError(null);
    try {
      await launch({
        reviewerCount,
        dryRun,
        verifyImplementation,
      });
    } catch (err) {
      setLaunchError((err as Error).message);
    }
  }, [launch, reviewerCount, dryRun, verifyImplementation]);

  // Build ReviewResult from activeReview for ReviewResultsView compatibility
  const reviewResult = activeReview && isCompleted
    ? {
        prNumber,
        prTitle: `PR #${prNumber}`,
        scope: activeReview.scope,
        status: activeReview.resultStatus ?? ("COMMENT" as const),
        body: activeReview.resultBody ?? "",
        findings: activeReview.findings,
        iterations: activeReview.iterationsCompleted,
        filesAnalyzed: activeReview.filesAnalyzed,
        reviewerCount: 0,
        dryRun: activeReview.dryRun,
      }
    : null;

  return (
    <div>
      <h3 className="text-2xs font-mono text-text-muted uppercase tracking-wider mb-2.5">
        Claude Review
      </h3>

      <div className="space-y-3">
        {/* Repo path config */}
        {settingsLoading ? (
          <div className="h-10 rounded-md bg-bg-surface animate-pulse" />
        ) : (
          <div>
            <label className="text-2xs font-mono text-text-muted mb-1 block">
              Chemin du monorepo
            </label>
            <RepoPathConfig
              currentPath={settings?.repoBasePath ?? null}
              onSave={updateRepoPath}
            />
          </div>
        )}

        {/* Config section — visible when path is set and can launch */}
        {settings?.repoBasePath && canLaunch && (
          <>
            {/* Scope badge */}
            <div className="flex items-center gap-2">
              <span className="text-2xs font-mono text-text-muted">Scope detecte :</span>
              <Badge variant="info" size="sm">
                {scope.toUpperCase()}
              </Badge>
            </div>

            {/* Reviewer count */}
            <div className="flex items-center gap-3">
              <span className="text-2xs font-mono text-text-muted">Reviewers :</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setReviewerCount("auto")}
                  className={cn(
                    "h-7 px-2.5 text-xs font-mono rounded-md border transition-all cursor-pointer",
                    reviewerCount === "auto"
                      ? "bg-status-info/15 text-status-info border-status-info/30"
                      : "bg-bg-surface text-text-secondary border-border hover:bg-bg-hover"
                  )}
                >
                  Auto
                </button>
                {[1, 2, 3, 5, 10].map((n) => (
                  <button
                    key={n}
                    onClick={() => setReviewerCount(n)}
                    className={cn(
                      "h-7 w-7 text-xs font-mono rounded-md border transition-all cursor-pointer",
                      reviewerCount === n
                        ? "bg-status-info/15 text-status-info border-status-info/30"
                        : "bg-bg-surface text-text-secondary border-border hover:bg-bg-hover"
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Dry run */}
            <label className="flex items-start gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={dryRun}
                onChange={(e) => setDryRun(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-border text-status-info focus:ring-status-info/50 bg-bg-surface cursor-pointer"
              />
              <div>
                <span className="text-xs text-text-primary group-hover:text-text-primary transition-colors">
                  Dry run — Afficher les resultats sans poster sur GitHub
                </span>
                <p className="text-2xs text-text-muted mt-0.5">
                  Les commentaires seront affiches dans le dashboard et pourront etre postes selectivement
                </p>
              </div>
            </label>

            {/* Verify implementation */}
            <label className="flex items-start gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={verifyImplementation}
                onChange={(e) => setVerifyImplementation(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-border text-status-info focus:ring-status-info/50 bg-bg-surface cursor-pointer"
              />
              <div>
                <span className="text-xs text-text-primary group-hover:text-text-primary transition-colors">
                  Verifier la conformite des librairies externes
                </span>
                <p className="text-2xs text-text-muted mt-0.5">
                  Verifie l&apos;utilisation des librairies avec leur documentation officielle via Context7
                </p>
              </div>
            </label>

            {/* Launch error */}
            {launchError && (
              <div className="rounded-lg border border-status-error/20 bg-status-error/5 p-3 text-xs text-status-error font-mono">
                {launchError}
              </div>
            )}

            {/* Launch button */}
            <Button
              variant="primary"
              size="md"
              className="w-full"
              onClick={handleLaunch}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0">
                <path d="M4 2l10 6-10 6V2z" fill="currentColor" />
              </svg>
              Lancer la review
            </Button>
          </>
        )}

        {/* Running state */}
        {isRunning && activeReview && (
          <div className="space-y-3">
            <ReviewProgress review={activeReview} />

            {/* Cancel button */}
            <Button
              variant="danger"
              size="sm"
              className="w-full"
              onClick={cancel}
            >
              Annuler
            </Button>
          </div>
        )}

        {/* Error/Failed state */}
        {isFailed && activeReview?.errorMessage && (
          <div className="rounded-lg border border-status-error/20 bg-status-error/5 p-3 text-xs text-status-error font-mono">
            {activeReview.errorMessage}
          </div>
        )}

        {/* Completed results (dry-run) */}
        {isCompleted && reviewResult && activeReview?.dryRun && (
          <ReviewResultsView
            result={reviewResult}
            reviewId={activeReview.id}
            onPostSingle={(finding) => postSingleFinding(finding)}
            onPostAll={() => postAllFindings()}
            prUrl={`https://github.com/${repositoryFullName}/pull/${prNumber}`}
          />
        )}

        {/* Completed results (non dry-run) */}
        {isCompleted && activeReview && !activeReview.dryRun && (
          <div className="flex items-center gap-3 rounded-lg border border-status-success/20 bg-status-success/8 p-3">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 text-status-success">
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
              <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-semibold text-status-success">Review postee sur GitHub</p>
              <p className="text-2xs text-text-muted font-mono mt-0.5">
                {activeReview.totalFindings} commentaire{activeReview.totalFindings > 1 ? "s" : ""} poste{activeReview.totalFindings > 1 ? "s" : ""}
              </p>
            </div>
            <a
              href={`https://github.com/${repositoryFullName}/pull/${prNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-2xs text-status-info hover:underline font-mono shrink-0"
            >
              Voir la PR
            </a>
          </div>
        )}

        {/* New review button */}
        {(isCompleted || isFailed) && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={resetView}
          >
            Nouvelle review
          </Button>
        )}

        {/* History */}
        {!isLoadingHistory && history.length > 0 && (
          <ReviewHistoryList
            history={history}
            onSelect={viewReview}
            activeReviewId={activeReview?.id}
          />
        )}
      </div>
    </div>
  );
}
