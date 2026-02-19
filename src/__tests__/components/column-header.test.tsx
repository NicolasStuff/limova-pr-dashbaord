import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ColumnHeader } from "@/components/board/column-header";
import type { ColumnDefinition } from "@/lib/utils/constants";

describe("ColumnHeader", () => {
  const definition: ColumnDefinition = {
    key: "ready_for_review",
    label: "Ready for Review",
    color: "#3b82f6",
    order: 1,
  };

  it("renders the column label", () => {
    render(<ColumnHeader definition={definition} count={5} />);
    expect(screen.getByText("Ready for Review")).toBeInTheDocument();
  });

  it("renders the count", () => {
    render(<ColumnHeader definition={definition} count={12} />);
    expect(screen.getByText("12")).toBeInTheDocument();
  });

  it("renders zero count", () => {
    render(<ColumnHeader definition={definition} count={0} />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });
});
