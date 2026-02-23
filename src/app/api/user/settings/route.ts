import { NextResponse } from "next/server";
import { z } from "zod";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const patchSchema = z.object({
  repoBasePath: z
    .string()
    .min(1, "Le chemin ne peut pas être vide")
    .regex(/^\//, "Le chemin doit être absolu (commencer par /)")
    .regex(/^[a-zA-Z0-9/_\-. ]+$/, "Le chemin contient des caractères invalides"),
});

export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  return NextResponse.json({
    repoBasePath: (user as typeof user & { repoBasePath: string | null }).repoBasePath ?? null,
  });
}

export async function PATCH(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = patchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid parameters", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  await db
    .update(users)
    .set({ repoBasePath: parsed.data.repoBasePath, updatedAt: new Date() })
    .where(eq(users.id, user.id));

  return NextResponse.json({ repoBasePath: parsed.data.repoBasePath });
}
