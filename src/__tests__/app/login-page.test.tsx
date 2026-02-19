import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import LoginPage from "@/app/login/page";

describe("LoginPage", () => {
  it("renders email form for magic link login", async () => {
    const ui = await LoginPage({
      searchParams: Promise.resolve({}),
    });

    render(ui);

    expect(screen.getByLabelText("Adresse email professionnelle")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Envoyer un Magic Link" })).toBeInTheDocument();

    const form = screen.getByRole("button", { name: "Envoyer un Magic Link" }).closest("form");
    expect(form).toHaveAttribute("action", "/api/auth/login");
    expect(form).toHaveAttribute("method", "POST");
  });

  it("renders invalid_domain error message", async () => {
    const ui = await LoginPage({
      searchParams: Promise.resolve({ error: "invalid_domain" }),
    });

    render(ui);

    expect(
      screen.getByText("Seules les adresses email se terminant par @limova.ai sont autorisées.", {
        exact: false,
      })
    ).toBeInTheDocument();
  });

  it("renders magic_link_sent status message", async () => {
    const ui = await LoginPage({
      searchParams: Promise.resolve({ status: "magic_link_sent" }),
    });

    render(ui);

    expect(
      screen.getByText("Un lien de connexion vient d'être envoyé par email.", { exact: false })
    ).toBeInTheDocument();
  });

  it("renders magic_link_invalid error message", async () => {
    const ui = await LoginPage({
      searchParams: Promise.resolve({ error: "magic_link_invalid" }),
    });

    render(ui);

    expect(
      screen.getByText("Ce lien de connexion est invalide ou expiré.", { exact: false })
    ).toBeInTheDocument();
  });
});
