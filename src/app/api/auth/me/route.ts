import { getUser } from "@/lib/auth";

export async function GET() {
  const user = await getUser();

  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  return Response.json(user);
}
