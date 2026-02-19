import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "@/components/ui/badge";

describe("Badge", () => {
  it("renders children text", () => {
    render(<Badge>Bug</Badge>);
    expect(screen.getByText("Bug")).toBeInTheDocument();
  });

  it("renders with default variant", () => {
    const { container } = render(<Badge>Default</Badge>);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("bg-bg-elevated");
  });

  it("renders with draft variant", () => {
    const { container } = render(<Badge variant="draft">Draft</Badge>);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("column-draft");
  });

  it("renders with merged variant", () => {
    const { container } = render(<Badge variant="merged">Merged</Badge>);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("column-merged");
  });

  it("renders with sm size", () => {
    const { container } = render(<Badge size="sm">Small</Badge>);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("px-1.5");
  });

  it("renders with md size", () => {
    const { container } = render(<Badge size="md">Medium</Badge>);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("px-2");
  });
});
