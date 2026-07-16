import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import HomePage from "./page";

describe("HomePage", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            status: "healthy",
            services: { api: "up", database: "up", redis: "up" },
            timestamp: "2026-01-01T00:00:00.000Z",
          },
          meta: null,
        }),
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the project name and eventually shows the health panel", async () => {
    render(<HomePage />);

    expect(screen.getByText("QR Platform")).toBeInTheDocument();
    expect(await screen.findByText("PostgreSQL")).toBeInTheDocument();
  });
});
