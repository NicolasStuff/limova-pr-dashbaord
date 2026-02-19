import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmptyColumn } from "@/components/board/empty-column";

describe("EmptyColumn", () => {
  it("renders the empty message with the label", () => {
    render(<EmptyColumn label="Draft" />);
    expect(screen.getByText("No PRs in Draft")).toBeInTheDocument();
  });

  it("renders with different label", () => {
    render(<EmptyColumn label="Approved" />);
    expect(screen.getByText("No PRs in Approved")).toBeInTheDocument();
  });
});
