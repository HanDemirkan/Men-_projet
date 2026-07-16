import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { HealthStatusPanel } from "./HealthStatusPanel";

describe("HealthStatusPanel", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows a loading state before the response resolves", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {})),
    );

    render(<HealthStatusPanel />);

    expect(screen.getByRole("status")).toHaveTextContent("kontrol ediliyor");
  });

  it("shows service statuses on a successful response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            status: "degraded",
            services: { api: "up", database: "down", redis: "up" },
            timestamp: "2026-01-01T00:00:00.000Z",
          },
          meta: null,
        }),
      }),
    );

    render(<HealthStatusPanel />);

    expect(await screen.findByText("PostgreSQL")).toBeInTheDocument();
    expect(screen.getAllByText("Çalışıyor")).toHaveLength(2);
    expect(screen.getByText("Kapalı")).toBeInTheDocument();
  });

  it("shows a friendly error message without a stack trace when the API is unreachable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("connect ECONNREFUSED 127.0.0.1:4000")),
    );

    render(<HealthStatusPanel />);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Sunucuya şu anda ulaşılamıyor");
    expect(alert.textContent).not.toContain("ECONNREFUSED");
  });
});
