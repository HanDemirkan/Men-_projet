import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import LandingPage from "./page";

describe("LandingPage", () => {
  it("renders the hero headline and CTAs", () => {
    render(<LandingPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "QR Menüden Fazlası" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Giriş Yap" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Ürünü Keşfet" }).length).toBeGreaterThan(0);
  });

  it("renders the main content sections", () => {
    render(<LandingPage />);

    expect(screen.getByRole("heading", { level: 2, name: "Özellikler" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Nasıl Çalışır" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Neden Biz" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Sıkça Sorulan Sorular" }),
    ).toBeInTheDocument();
  });
});
