import { validateSession } from "./session";
import { redirect } from "next/navigation";

export async function getUser() {
  const result = await validateSession();
  return result?.user ?? null;
}

export async function requireUser() {
  const result = await validateSession();
  if (!result) {
    redirect("/login");
  }
  return result.user;
}
