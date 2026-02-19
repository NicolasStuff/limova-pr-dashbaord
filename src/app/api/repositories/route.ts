import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getRepositories,
  getRepositoryByFullName,
  createRepository,
} from "@/lib/db/queries/repositories";
import { syncRepository } from "@/lib/github/sync";

const createRepoSchema = z.object({
  owner: z.string().min(1),
  name: z.string().min(1),
  defaultBranch: z.string().optional(),
});

export async function GET() {
  try {
    const repos = await getRepositories();
    return NextResponse.json({ repositories: repos });
  } catch (error) {
    console.error("[API] GET /api/repositories error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createRepoSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { owner, name, defaultBranch } = parsed.data;
    const fullName = `${owner}/${name}`;

    const existing = await getRepositoryByFullName(fullName);
    if (existing) {
      return NextResponse.json(
        { error: "Repository is already being tracked" },
        { status: 409 }
      );
    }

    const repo = await createRepository({
      owner,
      name,
      fullName,
      defaultBranch: defaultBranch ?? "main",
    });

    // Trigger initial sync in background (non-blocking)
    syncRepository(repo.id, "manual").catch((err) =>
      console.error(`[API] Initial sync for ${fullName} failed:`, err)
    );

    return NextResponse.json({ data: repo }, { status: 201 });
  } catch (error) {
    console.error("[API] POST /api/repositories error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
