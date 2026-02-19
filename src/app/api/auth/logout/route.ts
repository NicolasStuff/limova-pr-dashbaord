import { invalidateSession } from "@/lib/auth/session";

export async function POST() {
  await invalidateSession();
  return Response.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
}
