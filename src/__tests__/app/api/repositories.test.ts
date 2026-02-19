import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/db/queries/repositories", () => ({
  getRepositories: vi.fn(),
  getRepositoryByFullName: vi.fn(),
  createRepository: vi.fn(),
}));

vi.mock("@/lib/github/sync", () => ({
  syncRepository: vi.fn().mockResolvedValue({
    repositoryId: 1,
    repositoryFullName: "org/new-repo",
    status: "success",
    prsProcessed: 0,
    prsCreated: 0,
    prsUpdated: 0,
    durationMs: 100,
  }),
}));

import { GET, POST } from "@/app/api/repositories/route";
import {
  getRepositories,
  getRepositoryByFullName,
  createRepository,
} from "@/lib/db/queries/repositories";

const mockGetRepositories = vi.mocked(getRepositories);
const mockGetRepositoryByFullName = vi.mocked(getRepositoryByFullName);
const mockCreateRepository = vi.mocked(createRepository);

describe("API /api/repositories", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns list of repositories", async () => {
      mockGetRepositories.mockResolvedValue([
        {
          id: 1,
          owner: "org",
          name: "repo",
          fullName: "org/repo",
          isActive: true,
          defaultBranch: "main",
          webhookId: null,
          webhookSecret: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as never);

      const response = await GET();
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toHaveProperty("repositories");
      expect(json.repositories).toHaveLength(1);
    });
  });

  describe("POST", () => {
    it("validates request body with Zod", async () => {
      const request = new NextRequest("http://localhost:3000/api/repositories", {
        method: "POST",
        body: JSON.stringify({ owner: "", name: "" }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe("Invalid request body");
    });

    it("returns 409 when repository already exists", async () => {
      mockGetRepositoryByFullName.mockResolvedValue({
        id: 1,
        owner: "org",
        name: "repo",
        fullName: "org/repo",
        isActive: true,
        defaultBranch: "main",
        webhookId: null,
        webhookSecret: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never);

      const request = new NextRequest("http://localhost:3000/api/repositories", {
        method: "POST",
        body: JSON.stringify({ owner: "org", name: "repo" }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(409);
      expect(json.error).toBe("Repository is already being tracked");
    });

    it("creates repository and returns 201", async () => {
      mockGetRepositoryByFullName.mockResolvedValue(undefined);
      const mockRepo = {
        id: 2,
        owner: "org",
        name: "new-repo",
        fullName: "org/new-repo",
        isActive: true,
        defaultBranch: "main",
        webhookId: null,
        webhookSecret: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockCreateRepository.mockResolvedValue(mockRepo as never);

      const request = new NextRequest("http://localhost:3000/api/repositories", {
        method: "POST",
        body: JSON.stringify({ owner: "org", name: "new-repo" }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(201);
      expect(json).toHaveProperty("data");
      expect(json.data.fullName).toBe("org/new-repo");
    });
  });
});
