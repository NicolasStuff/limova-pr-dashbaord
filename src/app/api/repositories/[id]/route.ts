import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getRepositoryById,
  updateRepository,
  deleteRepository,
} from "@/lib/db/queries/repositories";

const updateRepoSchema = z.object({
  isActive: z.boolean().optional(),
  defaultBranch: z.string().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const repoId = Number(id);

    if (isNaN(repoId)) {
      return NextResponse.json({ error: "Invalid repository id" }, { status: 400 });
    }

    const repo = await getRepositoryById(repoId);

    if (!repo) {
      return NextResponse.json(
        { error: "Repository not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: repo });
  } catch (error) {
    console.error("[API] GET /api/repositories/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const repoId = Number(id);

    if (isNaN(repoId)) {
      return NextResponse.json({ error: "Invalid repository id" }, { status: 400 });
    }

    const existing = await getRepositoryById(repoId);
    if (!existing) {
      return NextResponse.json(
        { error: "Repository not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = updateRepoSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const repo = await updateRepository(repoId, parsed.data);
    return NextResponse.json({ data: repo });
  } catch (error) {
    console.error("[API] PUT /api/repositories/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const repoId = Number(id);

    if (isNaN(repoId)) {
      return NextResponse.json({ error: "Invalid repository id" }, { status: 400 });
    }

    const existing = await getRepositoryById(repoId);
    if (!existing) {
      return NextResponse.json(
        { error: "Repository not found" },
        { status: 404 }
      );
    }

    await deleteRepository(repoId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[API] DELETE /api/repositories/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
