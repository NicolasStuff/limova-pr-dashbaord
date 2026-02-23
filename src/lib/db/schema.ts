import {
  pgTable,
  pgEnum,
  serial,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const prColumnEnum = pgEnum("pr_column", [
  "draft",
  "ready_for_review",
  "review_in_progress",
  "changes_requested",
  "approved",
  "merged",
]);

export const syncStatusEnum = pgEnum("sync_status", [
  "running",
  "success",
  "failure",
]);

export const claudeReviewStatusEnum = pgEnum("claude_review_status", [
  "pending",
  "running",
  "completed",
  "failed",
  "cancelled",
]);

// Tables
export const repositories = pgTable("repositories", {
  id: serial("id").primaryKey(),
  owner: varchar("owner", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  fullName: varchar("full_name", { length: 511 }).notNull().unique(),
  isActive: boolean("is_active").default(true),
  webhookId: integer("webhook_id"),
  webhookSecret: varchar("webhook_secret", { length: 255 }),
  defaultBranch: varchar("default_branch", { length: 255 }).default("main"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const pullRequests = pgTable(
  "pull_requests",
  {
    id: serial("id").primaryKey(),
    repositoryId: integer("repository_id")
      .notNull()
      .references(() => repositories.id, { onDelete: "cascade" }),
    githubId: varchar("github_id", { length: 255 }).notNull(),
    number: integer("number").notNull(),
    title: text("title").notNull(),
    body: text("body"),
    url: varchar("url", { length: 2048 }).notNull(),
    state: varchar("state", { length: 20 }).notNull(),
    isDraft: boolean("is_draft").default(false),
    column: prColumnEnum("column").notNull(),
    authorLogin: varchar("author_login", { length: 255 }).notNull(),
    authorAvatarUrl: varchar("author_avatar_url", { length: 2048 }),
    reviewDecision: varchar("review_decision", { length: 50 }),
    commentsCount: integer("comments_count").default(0),
    reviewsCount: integer("reviews_count").default(0),
    changedFiles: integer("changed_files").default(0),
    additions: integer("additions").default(0),
    deletions: integer("deletions").default(0),
    ciStatus: varchar("ci_status", { length: 50 }),
    labels: jsonb("labels").default([]),
    requestedReviewers: jsonb("requested_reviewers").default([]),
    headRef: varchar("head_ref", { length: 255 }),
    baseRef: varchar("base_ref", { length: 255 }),
    githubCreatedAt: timestamp("github_created_at").notNull(),
    githubUpdatedAt: timestamp("github_updated_at").notNull(),
    mergedAt: timestamp("merged_at"),
    closedAt: timestamp("closed_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
    lastSyncedAt: timestamp("last_synced_at"),
  },
  (table) => [
    uniqueIndex("pull_requests_repo_number_idx").on(
      table.repositoryId,
      table.number
    ),
    index("pull_requests_column_idx").on(table.column),
    index("pull_requests_author_login_idx").on(table.authorLogin),
    index("pull_requests_github_updated_at_idx").on(table.githubUpdatedAt),
  ]
);

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  pullRequestId: integer("pull_request_id")
    .notNull()
    .references(() => pullRequests.id, { onDelete: "cascade" }),
  githubId: varchar("github_id", { length: 255 }).notNull().unique(),
  authorLogin: varchar("author_login", { length: 255 }).notNull(),
  authorAvatarUrl: varchar("author_avatar_url", { length: 2048 }),
  state: varchar("state", { length: 50 }).notNull(),
  body: text("body"),
  submittedAt: timestamp("submitted_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const syncLogs = pgTable("sync_logs", {
  id: serial("id").primaryKey(),
  repositoryId: integer("repository_id").references(() => repositories.id, {
    onDelete: "cascade",
  }),
  status: syncStatusEnum("status").notNull(),
  trigger: varchar("trigger", { length: 50 }).notNull(),
  prsProcessed: integer("prs_processed").default(0),
  prsCreated: integer("prs_created").default(0),
  prsUpdated: integer("prs_updated").default(0),
  errorMessage: text("error_message"),
  durationMs: integer("duration_ms"),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Claude Review tables
export const claudeReviews = pgTable(
  "claude_reviews",
  {
    id: serial("id").primaryKey(),
    pullRequestId: integer("pull_request_id")
      .notNull()
      .references(() => pullRequests.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: claudeReviewStatusEnum("status").notNull().default("pending"),
    scope: varchar("scope", { length: 20 }).notNull(),
    reviewerCount: varchar("reviewer_count", { length: 10 }).notNull(),
    dryRun: boolean("dry_run").notNull().default(true),
    verifyImplementation: boolean("verify_implementation").notNull().default(false),
    repositoryFullName: varchar("repository_full_name", { length: 511 }).notNull(),
    prNumber: integer("pr_number").notNull(),
    currentIteration: integer("current_iteration").default(0),
    maxIterations: integer("max_iterations").default(5),
    currentPhase: varchar("current_phase", { length: 100 }),
    progressPct: integer("progress_pct").default(0),
    resultStatus: varchar("result_status", { length: 20 }),
    resultBody: text("result_body"),
    filesAnalyzed: integer("files_analyzed").default(0),
    totalFindings: integer("total_findings").default(0),
    iterationsCompleted: integer("iterations_completed").default(0),
    errorMessage: text("error_message"),
    rawOutput: text("raw_output").default(""),
    structuredLog: jsonb("structured_log").default([]),
    postedToGithub: boolean("posted_to_github").default(false),
    postedAt: timestamp("posted_at"),
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("claude_reviews_pull_request_id_idx").on(table.pullRequestId),
    index("claude_reviews_user_id_idx").on(table.userId),
    index("claude_reviews_status_idx").on(table.status),
  ]
);

export const claudeReviewFindings = pgTable(
  "claude_review_findings",
  {
    id: serial("id").primaryKey(),
    reviewId: integer("review_id")
      .notNull()
      .references(() => claudeReviews.id, { onDelete: "cascade" }),
    findingHash: varchar("finding_hash", { length: 64 }).notNull(),
    file: varchar("file", { length: 1024 }).notNull(),
    line: integer("line").notNull(),
    severity: varchar("severity", { length: 20 }).notNull(),
    comment: text("comment").notNull(),
    suggestion: text("suggestion"),
    diffContext: text("diff_context"),
    iteration: integer("iteration").notNull(),
    postedToGithub: boolean("posted_to_github").default(false),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("claude_review_findings_review_id_idx").on(table.reviewId),
    unique("claude_review_findings_review_hash_idx").on(
      table.reviewId,
      table.findingHash
    ),
  ]
);

// Relations
export const repositoriesRelations = relations(repositories, ({ many }) => ({
  pullRequests: many(pullRequests),
  syncLogs: many(syncLogs),
}));

export const pullRequestsRelations = relations(
  pullRequests,
  ({ one, many }) => ({
    repository: one(repositories, {
      fields: [pullRequests.repositoryId],
      references: [repositories.id],
    }),
    reviews: many(reviews),
    claudeReviews: many(claudeReviews),
  })
);

export const reviewsRelations = relations(reviews, ({ one }) => ({
  pullRequest: one(pullRequests, {
    fields: [reviews.pullRequestId],
    references: [pullRequests.id],
  }),
}));

export const syncLogsRelations = relations(syncLogs, ({ one }) => ({
  repository: one(repositories, {
    fields: [syncLogs.repositoryId],
    references: [repositories.id],
  }),
}));

// Auth tables
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  repoBasePath: varchar("repo_base_path", { length: 1024 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const magicLinkTokens = pgTable(
  "magic_link_tokens",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 255 }).notNull(),
    tokenHash: varchar("token_hash", { length: 128 }).notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    usedAt: timestamp("used_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("magic_link_tokens_token_hash_idx").on(table.tokenHash),
    index("magic_link_tokens_email_idx").on(table.email),
  ]
);

export const claudeReviewsRelations = relations(
  claudeReviews,
  ({ one, many }) => ({
    pullRequest: one(pullRequests, {
      fields: [claudeReviews.pullRequestId],
      references: [pullRequests.id],
    }),
    user: one(users, {
      fields: [claudeReviews.userId],
      references: [users.id],
    }),
    findings: many(claudeReviewFindings),
  })
);

export const claudeReviewFindingsRelations = relations(
  claudeReviewFindings,
  ({ one }) => ({
    review: one(claudeReviews, {
      fields: [claudeReviewFindings.reviewId],
      references: [claudeReviews.id],
    }),
  })
);

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  claudeReviews: many(claudeReviews),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));
