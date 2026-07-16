import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import HealthPage from "./page";

describe("HealthPage", () => {
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

  it("renders the health heading and service statuses", async () => {
    render(<HealthPage />);

    expect(screen.getByText("Sistem Durumu")).toBeInTheDocument();
    expect(await screen.findByText("Redis")).toBeInTheDocument();
  });
});
