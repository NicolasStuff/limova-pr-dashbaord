import { eq } from "drizzle-orm";
import { db } from "../index";
import { repositories } from "../schema";

export async function getRepositories() {
  return db.query.repositories.findMany({
    where: eq(repositories.isActive, true),
    orderBy: (repos, { asc }) => [asc(repos.fullName)],
  });
}

export async function getRepositoryById(id: number) {
  return db.query.repositories.findFirst({
    where: eq(repositories.id, id),
  });
}

export async function getRepositoryByFullName(fullName: string) {
  return db.query.repositories.findFirst({
    where: eq(repositories.fullName, fullName),
  });
}

export async function createRepository(data: {
  owner: string;
  name: string;
  fullName: string;
  defaultBranch?: string;
}) {
  const [repo] = await db.insert(repositories).values(data).returning();
  return repo;
}

export async function updateRepository(
  id: number,
  data: Partial<{
    owner: string;
    name: string;
    fullName: string;
    isActive: boolean;
    webhookId: number;
    webhookSecret: string;
    defaultBranch: string;
  }>
) {
  const [repo] = await db
    .update(repositories)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(repositories.id, id))
    .returning();
  return repo;
}

export async function deleteRepository(id: number) {
  const [repo] = await db
    .delete(repositories)
    .where(eq(repositories.id, id))
    .returning();
  return repo;
}
