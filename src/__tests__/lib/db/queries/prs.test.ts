import { describe, it, expect } from "vitest";
import * as prsModule from "@/lib/db/queries/prs";

describe("DB Queries — prs module", () => {
  it("exports getPullRequests as a function", () => {
    expect(typeof prsModule.getPullRequests).toBe("function");
  });

  it("exports getPullRequestById as a function", () => {
    expect(typeof prsModule.getPullRequestById).toBe("function");
  });

  it("exports getPullRequestByRepoAndNumber as a function", () => {
    expect(typeof prsModule.getPullRequestByRepoAndNumber).toBe("function");
  });

  it("exports upsertPullRequest as a function", () => {
    expect(typeof prsModule.upsertPullRequest).toBe("function");
  });

  it("exports upsertReview as a function", () => {
    expect(typeof prsModule.upsertReview).toBe("function");
  });

  it("PrFilters interface allows all expected filter keys", () => {
    // Type-level check: this should compile without errors
    const filters: prsModule.PrFilters = {
      columns: ["draft", "merged"],
      repositoryIds: [1, 2],
      authorLogin: "testuser",
      labels: ["bug"],
      search: "auth",
      sort: "updated",
      sortDirection: "desc",
      limit: 50,
      offset: 0,
    };
    expect(filters.columns).toEqual(["draft", "merged"]);
    expect(filters.limit).toBe(50);
  });
});
