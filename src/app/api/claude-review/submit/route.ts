import { spawn } from "child_process";
import { NextResponse } from "next/server";
import { z } from "zod";
import { existsSync } from "fs";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  markFindingsPosted,
  markReviewPosted,
} from "@/lib/db/queries/claude-reviews";
import type { ReviewScope } from "@/types/claude-review";

const findingSchema = z.object({
  id: z.string(),
  dbId: z.number().int().positive().optional(),
  file: z.string(),
  line: z.number().int().positive(),
  severity: z.enum(["blocking", "major", "minor", "cosmetic"]),
  comment: z.string(),
  suggestion: z.string().optional(),
});

const singleSchema = z.object({
  mode: z.literal("single"),
  prNumber: z.number().int().positive(),
  repositoryFullName: z.string().min(1),
  reviewId: z.number().int().positive().optional(),
  finding: findingSchema,
});

const allSchema = z.object({
  mode: z.literal("all"),
  prNumber: z.number().int().positive(),
  repositoryFullName: z.string().min(1),
  reviewId: z.number().int().positive().optional(),
  status: z.enum(["REQUEST_CHANGES", "COMMENT", "APPROVE"]),
  body: z.string(),
  findings: z.array(findingSchema),
});

const submitSchema = z.discriminatedUnion("mode", [singleSchema, allSchema]);

function resolveScope(repositoryFullName: string): ReviewScope {
  const repoName = repositoryFullName.split("/").pop()?.toLowerCase() ?? "";
  if (repoName.includes("client")) return "client";
  return "api";
}

function runGh(args: string[], cwd: string): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve) => {
    const child = spawn("gh", args, { cwd });
    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (chunk: Buffer) => { stdout += chunk.toString(); });
    child.stderr?.on("data", (chunk: Buffer) => { stderr += chunk.toString(); });

    child.on("close", (code) => {
      resolve({ stdout, stderr, code: code ?? 1 });
    });

    child.on("error", (err) => {
      resolve({ stdout: "", stderr: err.message, code: 1 });
    });
  });
}

async function getOwnerRepo(prNumber: number, cwd: string, fallback: string): Promise<string> {
  const result = await runGh(
    ["pr", "view", String(prNumber), "--json", "url", "-q", ".url"],
    cwd
  );

  const match = result.stdout.trim().match(/github\.com\/([^/]+\/[^/]+)/);
  return match?.[1] ?? fallback;
}

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const [userRow] = await db
    .select({ repoBasePath: users.repoBasePath })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  const repoBasePath = userRow?.repoBasePath;
  if (!repoBasePath) {
    return NextResponse.json(
      { error: "Repo base path not configured" },
      { status: 400 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid parameters", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const scope = resolveScope(data.repositoryFullName);
  const cwd = `${repoBasePath}/${scope}`;

  if (!existsSync(cwd)) {
    return NextResponse.json(
      { error: `Directory not found: ${cwd}` },
      { status: 400 }
    );
  }

  const ownerRepo = await getOwnerRepo(data.prNumber, cwd, data.repositoryFullName);

  if (data.mode === "single") {
    // Post a single inline comment on the PR
    const commentBody =
      data.finding.comment +
      (data.finding.suggestion
        ? `\n\n**Suggestion :**\n\`\`\`\n${data.finding.suggestion}\n\`\`\``
        : "");

    // Get the latest commit SHA of the PR
    const prInfo = await runGh(
      ["pr", "view", String(data.prNumber), "--json", "headRefOid", "-q", ".headRefOid"],
      cwd
    );
    const commitSha = prInfo.stdout.trim();

    if (!commitSha) {
      return NextResponse.json(
        { error: "Could not determine PR head commit" },
        { status: 500 }
      );
    }

    const payloadWithCommit = JSON.stringify({
      body: commentBody,
      commit_id: commitSha,
      path: data.finding.file,
      line: data.finding.line,
      side: "RIGHT",
    });

    const child = spawn(
      "gh",
      [
        "api",
        `repos/${ownerRepo}/pulls/${data.prNumber}/comments`,
        "--method",
        "POST",
        "--input",
        "-",
      ],
      { cwd }
    );

    child.stdin?.write(payloadWithCommit);
    child.stdin?.end();

    const postResult = await new Promise<{ stdout: string; stderr: string; code: number }>((resolve) => {
      let stdout = "";
      let stderr = "";
      child.stdout?.on("data", (c: Buffer) => { stdout += c.toString(); });
      child.stderr?.on("data", (c: Buffer) => { stderr += c.toString(); });
      child.on("close", (code) => resolve({ stdout, stderr, code: code ?? 1 }));
    });

    if (postResult.code !== 0) {
      return NextResponse.json(
        { error: "Failed to post comment", details: postResult.stderr },
        { status: 500 }
      );
    }

    // Mark finding as posted in DB
    if (data.finding.dbId) {
      await markFindingsPosted([data.finding.dbId]);
    }

    return NextResponse.json({ success: true, findingId: data.finding.id });
  }

  // mode === "all" — post a full review
  const comments = data.findings.map((f) => ({
    path: f.file,
    line: f.line,
    body:
      f.comment +
      (f.suggestion
        ? `\n\n**Suggestion :**\n\`\`\`\n${f.suggestion}\n\`\`\``
        : ""),
  }));

  const reviewPayload = JSON.stringify({
    event: data.status,
    body: data.body,
    comments,
  });

  const child = spawn(
    "gh",
    [
      "api",
      `repos/${ownerRepo}/pulls/${data.prNumber}/reviews`,
      "--method",
      "POST",
      "--input",
      "-",
    ],
    { cwd }
  );

  child.stdin?.write(reviewPayload);
  child.stdin?.end();

  const postResult = await new Promise<{ stdout: string; stderr: string; code: number }>((resolve) => {
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (c: Buffer) => { stdout += c.toString(); });
    child.stderr?.on("data", (c: Buffer) => { stderr += c.toString(); });
    child.on("close", (code) => resolve({ stdout, stderr, code: code ?? 1 }));
  });

  if (postResult.code !== 0) {
    return NextResponse.json(
      { error: "Failed to post review", details: postResult.stderr },
      { status: 500 }
    );
  }

  // Mark findings and review as posted in DB
  const dbFindingIds = data.findings
    .map((f) => f.dbId)
    .filter((id): id is number => id !== undefined);

  if (dbFindingIds.length > 0) {
    await markFindingsPosted(dbFindingIds);
  }

  if (data.reviewId) {
    await markReviewPosted(data.reviewId);
  }

  return NextResponse.json({ success: true });
}
