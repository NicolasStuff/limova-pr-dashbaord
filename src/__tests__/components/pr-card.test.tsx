import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PrCard } from "@/components/board/pr-card";
import { createMockPullRequestCard } from "../helpers/mock-data";

describe("PrCard", () => {
  it("renders the PR title", () => {
    const pr = createMockPullRequestCard({ title: "Add new feature" });
    render(<PrCard pr={pr} />);
    expect(screen.getByText("Add new feature")).toBeInTheDocument();
  });

  it("renders the PR number", () => {
    const pr = createMockPullRequestCard({ number: 99 });
    render(<PrCard pr={pr} />);
    expect(screen.getByText("#99")).toBeInTheDocument();
  });

  it("renders the repository name", () => {
    const pr = createMockPullRequestCard({ repositoryFullName: "myorg/myrepo" });
    render(<PrCard pr={pr} />);
    expect(screen.getByText("myorg/myrepo")).toBeInTheDocument();
  });

  it("renders the author avatar", () => {
    const pr = createMockPullRequestCard({
      authorLogin: "johndoe",
      authorAvatarUrl: "https://avatar.test/johndoe",
    });
    render(<PrCard pr={pr} />);
    const img = screen.getByAltText("johndoe");
    expect(img).toBeInTheDocument();
  });

  it("renders labels when present", () => {
    const pr = createMockPullRequestCard({ labels: ["bugfix", "critical"] });
    render(<PrCard pr={pr} />);
    expect(screen.getByText("bugfix")).toBeInTheDocument();
    expect(screen.getByText("critical")).toBeInTheDocument();
  });

  it("renders changed files count", () => {
    const pr = createMockPullRequestCard({ changedFiles: 7 });
    render(<PrCard pr={pr} />);
    expect(screen.getByText("7f")).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const handleClick = vi.fn();
    const pr = createMockPullRequestCard();
    render(<PrCard pr={pr} onClick={handleClick} />);

    const card = screen.getByRole("button");
    card.click();

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
