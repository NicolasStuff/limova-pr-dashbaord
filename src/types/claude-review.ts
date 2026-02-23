export type ReviewScope = "api" | "client";
export type ReviewStatus = "idle" | "running" | "completed" | "error";
export type FindingSeverity = "blocking" | "major" | "minor" | "cosmetic";

export type ClaudeReviewDbStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export interface StructuredLogEntry {
  ts: string;
  phase: string;
  message: string;
}

export interface ReviewFinding {
  id: string;
  dbId?: number;
  file: string;
  line: number;
  severity: FindingSeverity;
  comment: string;
  suggestion?: string;
  diffContext?: string;
  iteration: number;
  posted?: boolean;
}

export interface ReviewResult {
  prNumber: number;
  prTitle: string;
  scope: ReviewScope;
  status: "REQUEST_CHANGES" | "COMMENT" | "APPROVE";
  body: string;
  findings: ReviewFinding[];
  iterations: number;
  filesAnalyzed: number;
  reviewerCount: number;
  dryRun: boolean;
}

export interface ClaudeReviewParams {
  prNumber: number;
  repositoryFullName: string;
  pullRequestId: number;
  reviewerCount: "auto" | number;
  dryRun: boolean;
  verifyImplementation: boolean;
}

export interface ClaudeReviewStatus {
  id: number;
  status: ClaudeReviewDbStatus;
  scope: ReviewScope;
  dryRun: boolean;
  currentIteration: number;
  maxIterations: number;
  currentPhase: string | null;
  progressPct: number;
  totalFindings: number;
  resultStatus: "REQUEST_CHANGES" | "COMMENT" | "APPROVE" | null;
  resultBody: string | null;
  filesAnalyzed: number;
  iterationsCompleted: number;
  errorMessage: string | null;
  rawOutput: string;
  structuredLog: StructuredLogEntry[];
  postedToGithub: boolean;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  findings: ReviewFinding[];
}

export interface ReviewHistoryItem {
  id: number;
  status: ClaudeReviewDbStatus;
  scope: ReviewScope;
  dryRun: boolean;
  resultStatus: string | null;
  totalFindings: number;
  iterationsCompleted: number;
  postedToGithub: boolean;
  createdAt: string;
  completedAt: string | null;
}

export interface ReviewStreamEvent {
  type: "log" | "iteration" | "finding" | "result" | "error" | "done";
  text?: string;
  iteration?: number;
  newCount?: number;
  converged?: boolean;
  finding?: ReviewFinding;
  result?: ReviewResult;
  exitCode?: number;
}
