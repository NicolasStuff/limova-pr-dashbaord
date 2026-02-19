import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;
const connection = postgres(connectionString);
const db = drizzle(connection, { schema });

async function seed() {
  console.log("Seeding database...");

  // Clear existing data
  await db.delete(schema.reviews);
  await db.delete(schema.syncLogs);
  await db.delete(schema.pullRequests);
  await db.delete(schema.repositories);

  // Insert repositories
  const [repoApi, repoClient] = await db
    .insert(schema.repositories)
    .values([
      {
        owner: "limova",
        name: "api",
        fullName: "limova/api",
        isActive: true,
        defaultBranch: "main",
      },
      {
        owner: "limova",
        name: "client",
        fullName: "limova/client",
        isActive: true,
        defaultBranch: "main",
      },
    ])
    .returning();

  console.log(`Created ${2} repositories`);

  // Insert pull requests
  const now = new Date();
  const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000);
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600000);

  const prs = await db
    .insert(schema.pullRequests)
    .values([
      {
        repositoryId: repoApi.id,
        githubId: "PR_api_1",
        number: 42,
        title: "feat: add authentication middleware",
        body: "Implements JWT-based authentication middleware for API routes.",
        url: "https://github.com/limova/api/pull/42",
        state: "open",
        isDraft: true,
        column: "draft",
        authorLogin: "alice",
        authorAvatarUrl: "https://avatars.githubusercontent.com/u/1?v=4",
        commentsCount: 2,
        reviewsCount: 0,
        changedFiles: 5,
        additions: 180,
        deletions: 12,
        ciStatus: "pending",
        labels: JSON.stringify(["feature", "auth"]),
        requestedReviewers: JSON.stringify(["bob"]),
        headRef: "feat/auth-middleware",
        baseRef: "main",
        githubCreatedAt: daysAgo(3),
        githubUpdatedAt: hoursAgo(6),
      },
      {
        repositoryId: repoApi.id,
        githubId: "PR_api_2",
        number: 43,
        title: "fix: rate limiter edge case on concurrent requests",
        body: "Fixes a race condition in the rate limiter when handling burst traffic.",
        url: "https://github.com/limova/api/pull/43",
        state: "open",
        isDraft: false,
        column: "ready_for_review",
        authorLogin: "bob",
        authorAvatarUrl: "https://avatars.githubusercontent.com/u/2?v=4",
        commentsCount: 1,
        reviewsCount: 0,
        changedFiles: 3,
        additions: 45,
        deletions: 8,
        ciStatus: "success",
        labels: JSON.stringify(["bug", "priority:high"]),
        requestedReviewers: JSON.stringify(["alice", "charlie"]),
        headRef: "fix/rate-limiter",
        baseRef: "main",
        githubCreatedAt: daysAgo(1),
        githubUpdatedAt: hoursAgo(2),
      },
      {
        repositoryId: repoApi.id,
        githubId: "PR_api_3",
        number: 44,
        title: "refactor: database connection pooling",
        body: "Refactors the DB connection layer to use proper connection pooling.",
        url: "https://github.com/limova/api/pull/44",
        state: "open",
        isDraft: false,
        column: "review_in_progress",
        authorLogin: "charlie",
        authorAvatarUrl: "https://avatars.githubusercontent.com/u/3?v=4",
        reviewDecision: "REVIEW_REQUIRED",
        commentsCount: 5,
        reviewsCount: 2,
        changedFiles: 8,
        additions: 220,
        deletions: 95,
        ciStatus: "success",
        labels: JSON.stringify(["refactor"]),
        requestedReviewers: JSON.stringify([]),
        headRef: "refactor/db-pooling",
        baseRef: "main",
        githubCreatedAt: daysAgo(5),
        githubUpdatedAt: hoursAgo(1),
      },
      {
        repositoryId: repoApi.id,
        githubId: "PR_api_4",
        number: 45,
        title: "feat: add OpenAPI spec generation",
        body: "Auto-generates OpenAPI 3.1 specs from route definitions.",
        url: "https://github.com/limova/api/pull/45",
        state: "open",
        isDraft: false,
        column: "changes_requested",
        authorLogin: "alice",
        authorAvatarUrl: "https://avatars.githubusercontent.com/u/1?v=4",
        reviewDecision: "CHANGES_REQUESTED",
        commentsCount: 8,
        reviewsCount: 3,
        changedFiles: 12,
        additions: 350,
        deletions: 20,
        ciStatus: "success",
        labels: JSON.stringify(["feature", "docs"]),
        requestedReviewers: JSON.stringify([]),
        headRef: "feat/openapi-gen",
        baseRef: "main",
        githubCreatedAt: daysAgo(7),
        githubUpdatedAt: hoursAgo(12),
      },
      {
        repositoryId: repoClient.id,
        githubId: "PR_client_1",
        number: 101,
        title: "feat: dashboard layout with sidebar navigation",
        body: "Implements the main dashboard layout with collapsible sidebar.",
        url: "https://github.com/limova/client/pull/101",
        state: "open",
        isDraft: false,
        column: "approved",
        authorLogin: "diana",
        authorAvatarUrl: "https://avatars.githubusercontent.com/u/4?v=4",
        reviewDecision: "APPROVED",
        commentsCount: 3,
        reviewsCount: 2,
        changedFiles: 10,
        additions: 420,
        deletions: 15,
        ciStatus: "success",
        labels: JSON.stringify(["feature", "ui"]),
        requestedReviewers: JSON.stringify([]),
        headRef: "feat/dashboard-layout",
        baseRef: "main",
        githubCreatedAt: daysAgo(4),
        githubUpdatedAt: hoursAgo(3),
      },
      {
        repositoryId: repoClient.id,
        githubId: "PR_client_2",
        number: 102,
        title: "feat: PR card component with status indicators",
        body: "Creates the PR card component used in the kanban board.",
        url: "https://github.com/limova/client/pull/102",
        state: "closed",
        isDraft: false,
        column: "merged",
        authorLogin: "bob",
        authorAvatarUrl: "https://avatars.githubusercontent.com/u/2?v=4",
        reviewDecision: "APPROVED",
        commentsCount: 6,
        reviewsCount: 2,
        changedFiles: 7,
        additions: 280,
        deletions: 30,
        ciStatus: "success",
        labels: JSON.stringify(["feature", "ui"]),
        requestedReviewers: JSON.stringify([]),
        headRef: "feat/pr-card",
        baseRef: "main",
        githubCreatedAt: daysAgo(10),
        githubUpdatedAt: daysAgo(2),
        mergedAt: daysAgo(2),
      },
      {
        repositoryId: repoClient.id,
        githubId: "PR_client_3",
        number: 103,
        title: "fix: dark mode toggle persistence",
        body: "Fixes dark mode preference not persisting across page reloads.",
        url: "https://github.com/limova/client/pull/103",
        state: "open",
        isDraft: false,
        column: "ready_for_review",
        authorLogin: "eve",
        authorAvatarUrl: "https://avatars.githubusercontent.com/u/5?v=4",
        commentsCount: 0,
        reviewsCount: 0,
        changedFiles: 2,
        additions: 25,
        deletions: 10,
        ciStatus: "success",
        labels: JSON.stringify(["bug"]),
        requestedReviewers: JSON.stringify(["diana"]),
        headRef: "fix/dark-mode-toggle",
        baseRef: "main",
        githubCreatedAt: hoursAgo(8),
        githubUpdatedAt: hoursAgo(4),
      },
      {
        repositoryId: repoApi.id,
        githubId: "PR_api_5",
        number: 46,
        title: "chore: upgrade dependencies to latest",
        body: "Updates all dependencies to their latest compatible versions.",
        url: "https://github.com/limova/api/pull/46",
        state: "closed",
        isDraft: false,
        column: "merged",
        authorLogin: "charlie",
        authorAvatarUrl: "https://avatars.githubusercontent.com/u/3?v=4",
        reviewDecision: "APPROVED",
        commentsCount: 1,
        reviewsCount: 1,
        changedFiles: 2,
        additions: 150,
        deletions: 140,
        ciStatus: "success",
        labels: JSON.stringify(["chore"]),
        requestedReviewers: JSON.stringify([]),
        headRef: "chore/upgrade-deps",
        baseRef: "main",
        githubCreatedAt: daysAgo(6),
        githubUpdatedAt: daysAgo(4),
        mergedAt: daysAgo(4),
      },
      {
        repositoryId: repoClient.id,
        githubId: "PR_client_4",
        number: 104,
        title: "feat: real-time sync status indicator",
        body: "Adds a visual indicator showing the last sync time and status.",
        url: "https://github.com/limova/client/pull/104",
        state: "open",
        isDraft: true,
        column: "draft",
        authorLogin: "alice",
        authorAvatarUrl: "https://avatars.githubusercontent.com/u/1?v=4",
        commentsCount: 0,
        reviewsCount: 0,
        changedFiles: 4,
        additions: 95,
        deletions: 5,
        ciStatus: "pending",
        labels: JSON.stringify(["feature", "wip"]),
        requestedReviewers: JSON.stringify([]),
        headRef: "feat/sync-indicator",
        baseRef: "main",
        githubCreatedAt: hoursAgo(2),
        githubUpdatedAt: hoursAgo(1),
      },
    ])
    .returning();

  console.log(`Created ${prs.length} pull requests`);

  // Insert reviews
  const prMap = Object.fromEntries(prs.map((pr) => [`${pr.githubId}`, pr.id]));

  const reviewsData = await db
    .insert(schema.reviews)
    .values([
      // Reviews for PR_api_3 (review_in_progress)
      {
        pullRequestId: prMap["PR_api_3"],
        githubId: "REV_1",
        authorLogin: "alice",
        authorAvatarUrl: "https://avatars.githubusercontent.com/u/1?v=4",
        state: "COMMENTED",
        body: "Looks good overall, but I have some questions about the pool size config.",
        submittedAt: daysAgo(2),
      },
      {
        pullRequestId: prMap["PR_api_3"],
        githubId: "REV_2",
        authorLogin: "bob",
        authorAvatarUrl: "https://avatars.githubusercontent.com/u/2?v=4",
        state: "APPROVED",
        body: "LGTM! The connection reuse pattern is solid.",
        submittedAt: hoursAgo(5),
      },
      // Reviews for PR_api_4 (changes_requested)
      {
        pullRequestId: prMap["PR_api_4"],
        githubId: "REV_3",
        authorLogin: "bob",
        authorAvatarUrl: "https://avatars.githubusercontent.com/u/2?v=4",
        state: "CHANGES_REQUESTED",
        body: "The spec output is missing some required fields. Please check the OpenAPI 3.1 spec.",
        submittedAt: daysAgo(3),
      },
      {
        pullRequestId: prMap["PR_api_4"],
        githubId: "REV_4",
        authorLogin: "charlie",
        authorAvatarUrl: "https://avatars.githubusercontent.com/u/3?v=4",
        state: "COMMENTED",
        body: "Would be nice to add example values in the generated schemas.",
        submittedAt: daysAgo(2),
      },
      {
        pullRequestId: prMap["PR_api_4"],
        githubId: "REV_5",
        authorLogin: "bob",
        authorAvatarUrl: "https://avatars.githubusercontent.com/u/2?v=4",
        state: "CHANGES_REQUESTED",
        body: "Still missing the response schema for the auth endpoints.",
        submittedAt: daysAgo(1),
      },
      // Reviews for PR_client_1 (approved)
      {
        pullRequestId: prMap["PR_client_1"],
        githubId: "REV_6",
        authorLogin: "bob",
        authorAvatarUrl: "https://avatars.githubusercontent.com/u/2?v=4",
        state: "APPROVED",
        body: "Great layout implementation!",
        submittedAt: daysAgo(1),
      },
      {
        pullRequestId: prMap["PR_client_1"],
        githubId: "REV_7",
        authorLogin: "charlie",
        authorAvatarUrl: "https://avatars.githubusercontent.com/u/3?v=4",
        state: "APPROVED",
        body: "Sidebar collapse animation is smooth. Ship it!",
        submittedAt: hoursAgo(6),
      },
      // Reviews for PR_client_2 (merged)
      {
        pullRequestId: prMap["PR_client_2"],
        githubId: "REV_8",
        authorLogin: "alice",
        authorAvatarUrl: "https://avatars.githubusercontent.com/u/1?v=4",
        state: "APPROVED",
        body: "Card component looks clean. Good use of status colors.",
        submittedAt: daysAgo(3),
      },
      {
        pullRequestId: prMap["PR_client_2"],
        githubId: "REV_9",
        authorLogin: "diana",
        authorAvatarUrl: "https://avatars.githubusercontent.com/u/4?v=4",
        state: "APPROVED",
        body: "LGTM",
        submittedAt: daysAgo(2),
      },
      // Review for PR_api_5 (merged)
      {
        pullRequestId: prMap["PR_api_5"],
        githubId: "REV_10",
        authorLogin: "alice",
        authorAvatarUrl: "https://avatars.githubusercontent.com/u/1?v=4",
        state: "APPROVED",
        body: "All tests pass with the new versions. Good to merge.",
        submittedAt: daysAgo(4),
      },
    ])
    .returning();

  console.log(`Created ${reviewsData.length} reviews`);

  // Insert sync log
  const syncLogsData = await db
    .insert(schema.syncLogs)
    .values([
      {
        repositoryId: repoApi.id,
        status: "success",
        trigger: "scheduled",
        prsProcessed: 5,
        prsCreated: 1,
        prsUpdated: 4,
        durationMs: 2340,
        startedAt: hoursAgo(1),
        completedAt: new Date(hoursAgo(1).getTime() + 2340),
      },
      {
        repositoryId: repoClient.id,
        status: "success",
        trigger: "scheduled",
        prsProcessed: 4,
        prsCreated: 1,
        prsUpdated: 3,
        durationMs: 1870,
        startedAt: hoursAgo(1),
        completedAt: new Date(hoursAgo(1).getTime() + 1870),
      },
    ])
    .returning();

  console.log(`Created ${syncLogsData.length} sync logs`);

  console.log("Seeding complete!");
  await connection.end();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
