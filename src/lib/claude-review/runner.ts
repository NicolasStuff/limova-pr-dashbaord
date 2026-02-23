import { spawn, type ChildProcess } from "child_process";
import { randomUUID } from "crypto";
import { readFile, writeFile, mkdir, rm } from "fs/promises";
import { existsSync } from "fs";
import type { ReviewFinding, ReviewScope, StructuredLogEntry } from "@/types/claude-review";
import {
  updateClaudeReview,
  insertFindings,
  markStaleReviewsFailed,
  getClaudeReviewById,
} from "@/lib/db/queries/claude-reviews";
import { buildInitialReviewPrompt, buildIterationPrompt } from "./prompt-builder";

const activeControllers = new Map<number, AbortController>();

// Mark stale reviews as failed on module load (server restart recovery)
markStaleReviewsFailed().catch(() => {
  // Ignore errors during startup recovery
});

function hashFinding(f: { file: string; line: number; severity: string; comment: string }): string {
  const raw = `${f.file}:${f.line}:${f.severity}:${f.comment.slice(0, 50)}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash).toString(36);
}

function spawnClaude(prompt: string, cwd: string, signal: AbortSignal): ChildProcess {
  // Clean env: remove Claude Code internal vars to allow nested invocation
  const env: NodeJS.ProcessEnv = { ...process.env, FORCE_COLOR: "0" };
  delete env.CLAUDECODE;
  delete env.CLAUDE_CODE_SSE_PORT;
  delete env.CLAUDE_CODE_ENTRYPOINT;
  delete env.CLAUDE_CODE_SUBAGENT_MODEL;
  delete env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS;

  const child = spawn(
    "claude",
    [
      "-p",
      prompt,
      "--allowedTools",
      "Bash(gh:*),Bash(git show:*),Bash(git fetch:*),Bash(git diff:*),Bash(git log:*),Bash(git rev-parse:*),Bash(git branch:*),Bash(cat:*),Bash(cd:*),Read,Task",
      "--output-format",
      "stream-json",
      "--verbose",
      "--max-turns",
      "200",
    ],
    {
      cwd,
      env,
    }
  );

  // Close stdin immediately to prevent blocking
  child.stdin?.end();

  const abortHandler = () => {
    child.kill("SIGTERM");
  };
  signal.addEventListener("abort", abortHandler);

  child.on("close", () => {
    signal.removeEventListener("abort", abortHandler);
  });

  return child;
}

function waitForProcess(child: ChildProcess): Promise<number> {
  return new Promise((resolve) => {
    child.on("close", (code) => resolve(code ?? 1));
    child.on("error", () => resolve(1));
  });
}

async function readFindingsFromFile(filePath: string): Promise<ReviewFinding[]> {
  try {
    if (!existsSync(filePath)) return [];
    const content = await readFile(filePath, "utf-8");
    const trimmed = content.trim();
    if (!trimmed || trimmed === "[]") return [];
    const parsed = JSON.parse(trimmed);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function resolveScope(repositoryFullName: string): ReviewScope {
  const repoName = repositoryFullName.split("/").pop()?.toLowerCase() ?? "";
  if (repoName.includes("client")) return "client";
  return "api";
}

function buildResultStatus(findings: ReviewFinding[]): "REQUEST_CHANGES" | "COMMENT" | "APPROVE" {
  const hasBlocking = findings.some((f) => f.severity === "blocking");
  const hasMajor = findings.some((f) => f.severity === "major");
  if (hasBlocking || hasMajor) return "REQUEST_CHANGES";
  if (findings.length > 0) return "COMMENT";
  return "APPROVE";
}

function buildResultBody(
  findings: ReviewFinding[],
  prNumber: number,
  scope: ReviewScope,
  iterations: number,
  reviewerCount: string
): string {
  const filesAnalyzed = new Set(findings.map((f) => f.file)).size;

  const severityCounts = findings.reduce(
    (acc, f) => {
      acc[f.severity] = (acc[f.severity] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return [
    `Review de la PR #${prNumber} (${scope})`,
    "",
    `**Fichiers analyses** : ${filesAnalyzed}`,
    `**Iterations** : ${iterations}`,
    `**Reviewers** : ${reviewerCount}`,
    "",
    "### Findings par severite",
    `| Severite | Count |`,
    `|----------|-------|`,
    `| Bloquant | ${severityCounts.blocking ?? 0} |`,
    `| Majeur | ${severityCounts.major ?? 0} |`,
    `| Mineur | ${severityCounts.minor ?? 0} |`,
    `| Cosmetique | ${severityCounts.cosmetic ?? 0} |`,
  ].join("\n");
}

async function appendLog(
  reviewId: number,
  existingLog: StructuredLogEntry[],
  phase: string,
  message: string
): Promise<StructuredLogEntry[]> {
  const entry: StructuredLogEntry = {
    ts: new Date().toISOString(),
    phase,
    message,
  };
  const newLog = [...existingLog, entry];
  await updateClaudeReview(reviewId, { structuredLog: newLog });
  return newLog;
}

interface RunReviewParams {
  repoBasePath: string;
  prNumber: number;
  repositoryFullName: string;
  scope: ReviewScope;
  reviewerCount: string;
  verifyImplementation: boolean;
  maxIterations: number;
}

export async function runReviewBackground(reviewId: number, params: RunReviewParams) {
  const controller = new AbortController();
  activeControllers.set(reviewId, controller);

  const {
    repoBasePath,
    prNumber,
    repositoryFullName,
    scope,
    reviewerCount,
    verifyImplementation,
    maxIterations,
  } = params;

  const cwd = `${repoBasePath}/${scope}`;
  const tmpId = randomUUID();
  const tmpDir = `/tmp/claude-review-${tmpId}`;
  const findingsFilePath = `${tmpDir}/findings.json`;

  let structuredLog: StructuredLogEntry[] = [];
  let rawOutput = "";
  const MAX_RAW_LENGTH = 50000;

  function appendRaw(text: string) {
    rawOutput += text;
    if (rawOutput.length > MAX_RAW_LENGTH) {
      rawOutput = "...(tronque)...\n" + rawOutput.slice(-MAX_RAW_LENGTH);
    }
  }

  try {
    // Transition to running
    await updateClaudeReview(reviewId, {
      status: "running",
      startedAt: new Date(),
      currentPhase: "preparation",
      progressPct: 5,
    });

    structuredLog = await appendLog(reviewId, structuredLog, "start", "Preparation: analyse du diff...");

    await mkdir(tmpDir, { recursive: true });
    await writeFile(findingsFilePath, "[]", "utf-8");

    let allFindings: ReviewFinding[] = [];
    let iteration = 0;
    let converged = false;

    while (iteration < maxIterations && !converged) {
      if (controller.signal.aborted) {
        await updateClaudeReview(reviewId, {
          status: "cancelled",
          completedAt: new Date(),
          currentPhase: "cancelled",
        });
        structuredLog = await appendLog(reviewId, structuredLog, "cancelled", "Review annulee par l'utilisateur");
        return;
      }

      iteration++;
      const progressBase = Math.round((iteration / maxIterations) * 80) + 10; // 10-90%

      await updateClaudeReview(reviewId, {
        currentIteration: iteration,
        currentPhase: "spawning_reviewers",
        progressPct: progressBase,
        iterationsCompleted: iteration - 1,
      });

      const reviewerCountNum = reviewerCount === "auto" ? "auto" : reviewerCount;
      structuredLog = await appendLog(
        reviewId,
        structuredLog,
        `iteration_${iteration}`,
        `Iteration ${iteration}/${maxIterations}: lancement des reviewers (${reviewerCountNum})`
      );

      // Reset findings file for this iteration
      await writeFile(findingsFilePath, "[]", "utf-8");

      // Build prompt
      const promptParams = {
        prNumber,
        scope,
        repoBasePath,
        reviewerCount: reviewerCount === "auto" ? ("auto" as const) : Number(reviewerCount),
        verifyImplementation,
        findingsFilePath,
        iteration,
      };

      const prompt =
        iteration === 1
          ? buildInitialReviewPrompt(promptParams)
          : buildIterationPrompt(promptParams, allFindings);

      await updateClaudeReview(reviewId, {
        currentPhase: "running_review",
        progressPct: progressBase + 5,
      });

      // Spawn claude
      const child = spawnClaude(prompt, cwd, controller.signal);

      // Capture stdout (stream-json) and stderr
      let streamBuffer = "";
      child.stdout?.on("data", (chunk: Buffer) => {
        streamBuffer += chunk.toString();
        const lines = streamBuffer.split("\n");
        streamBuffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const event = JSON.parse(line);
            // Extract readable text from stream-json events
            if (event.type === "assistant" && event.message?.content) {
              for (const block of event.message.content) {
                if (block.type === "text" && block.text) {
                  appendRaw(block.text);
                } else if (block.type === "tool_use") {
                  appendRaw(`\n[tool] ${block.name}(${JSON.stringify(block.input).slice(0, 200)})\n`);
                }
              }
            } else if (event.type === "result") {
              if (event.result) {
                appendRaw(`\n[result] cost=$${event.cost_usd?.toFixed(2) ?? "?"} turns=${event.num_turns ?? "?"}\n`);
              }
            }
          } catch {
            // Not JSON — append raw
            appendRaw(line + "\n");
          }
        }
      });
      child.stderr?.on("data", (chunk: Buffer) => {
        appendRaw(`[stderr] ${chunk.toString()}`);
      });

      // Flush raw output to DB every 3s for real-time observability
      const flushInterval = setInterval(async () => {
        try {
          await updateClaudeReview(reviewId, { rawOutput });
        } catch {
          // Ignore flush errors
        }
      }, 3000);

      // Wait for completion
      const exitCode = await waitForProcess(child);

      // Stop flushing, do final flush
      clearInterval(flushInterval);
      await updateClaudeReview(reviewId, { rawOutput });

      if (controller.signal.aborted) {
        await updateClaudeReview(reviewId, {
          status: "cancelled",
          completedAt: new Date(),
          currentPhase: "cancelled",
        });
        structuredLog = await appendLog(reviewId, structuredLog, "cancelled", "Review annulee par l'utilisateur");
        return;
      }

      if (exitCode !== 0) {
        structuredLog = await appendLog(
          reviewId,
          structuredLog,
          `iteration_${iteration}`,
          `Processus termine avec code ${exitCode}`
        );
      }

      // Read findings from this iteration
      await updateClaudeReview(reviewId, {
        currentPhase: "collecting_findings",
        progressPct: progressBase + 10,
      });

      const iterationFindings = await readFindingsFromFile(findingsFilePath);

      // Normalize and hash findings
      const normalizedFindings = iterationFindings.map((f) => ({
        ...f,
        id: f.id || hashFinding(f),
        iteration,
      }));

      // Calculate delta
      const knownIds = new Set(allFindings.map((f) => f.id));
      const knownKeys = new Set(
        allFindings.map((f) => `${f.file}:${f.line}:${f.severity}`)
      );
      const trulyNew = normalizedFindings.filter(
        (f) => !knownIds.has(f.id) && !knownKeys.has(`${f.file}:${f.line}:${f.severity}`)
      );

      if (trulyNew.length === 0) {
        converged = true;
        structuredLog = await appendLog(
          reviewId,
          structuredLog,
          `iteration_${iteration}`,
          `Convergence atteinte, pas de nouveaux findings`
        );
      } else {
        allFindings = [...allFindings, ...trulyNew];

        // Insert findings into DB
        const dbFindings = trulyNew.map((f) => ({
          findingHash: hashFinding(f),
          file: f.file,
          line: f.line,
          severity: f.severity,
          comment: f.comment,
          suggestion: f.suggestion,
          diffContext: f.diffContext,
          iteration: f.iteration,
        }));

        await insertFindings(reviewId, dbFindings);

        const severityCounts = trulyNew.reduce(
          (acc, f) => {
            acc[f.severity] = (acc[f.severity] ?? 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        );

        const severityStr = Object.entries(severityCounts)
          .map(([s, c]) => `${c} ${s}`)
          .join(", ");

        structuredLog = await appendLog(
          reviewId,
          structuredLog,
          `iteration_${iteration}`,
          `Iteration ${iteration}: ${trulyNew.length} findings trouves (${severityStr})`
        );
      }

      // Update totals
      const filesAnalyzed = new Set(allFindings.map((f) => f.file)).size;
      await updateClaudeReview(reviewId, {
        totalFindings: allFindings.length,
        filesAnalyzed,
        iterationsCompleted: iteration,
      });
    }

    // Build final result
    const resultStatus = buildResultStatus(allFindings);
    const resultBody = buildResultBody(
      allFindings,
      prNumber,
      scope,
      iteration,
      reviewerCount
    );
    const filesAnalyzed = new Set(allFindings.map((f) => f.file)).size;

    await updateClaudeReview(reviewId, {
      status: "completed",
      currentPhase: "completed",
      progressPct: 100,
      resultStatus,
      resultBody,
      filesAnalyzed,
      totalFindings: allFindings.length,
      iterationsCompleted: iteration,
      completedAt: new Date(),
    });

    structuredLog = await appendLog(
      reviewId,
      structuredLog,
      "completed",
      `Review terminee: ${resultStatus} (${allFindings.length} findings, ${filesAnalyzed} fichiers, ${iteration} iterations)`
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Erreur inconnue";

    await updateClaudeReview(reviewId, {
      status: "failed",
      errorMessage,
      completedAt: new Date(),
      currentPhase: "error",
    });

    await appendLog(reviewId, structuredLog, "error", errorMessage);
  } finally {
    activeControllers.delete(reviewId);

    // Cleanup temp dir
    try {
      await rm(tmpDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }
}

export async function cancelReview(reviewId: number) {
  const controller = activeControllers.get(reviewId);
  if (controller) {
    controller.abort();
    activeControllers.delete(reviewId);
  }

  // Also update DB in case the process already died
  const review = await getClaudeReviewById(reviewId);
  if (review && (review.status === "running" || review.status === "pending")) {
    await updateClaudeReview(reviewId, {
      status: "cancelled",
      completedAt: new Date(),
      currentPhase: "cancelled",
      errorMessage: "Annule par l'utilisateur",
    });
  }
}
