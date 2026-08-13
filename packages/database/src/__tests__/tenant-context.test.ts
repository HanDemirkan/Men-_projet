import { describe, expect, it } from "vitest";

import { getCurrentTenantId, runWithTenantContext } from "../tenant-context";

describe("tenant-context (AsyncLocalStorage)", () => {
  it("returns undefined when called outside any tenant context", () => {
    expect(getCurrentTenantId()).toBeUndefined();
  });

  it("makes the tenantId available synchronously inside the callback", () => {
    runWithTenantContext("tenant-a", () => {
      expect(getCurrentTenantId()).toBe("tenant-a");
    });
  });

  it("makes the tenantId available across an awaited async boundary", async () => {
    const observed = await runWithTenantContext("tenant-a", async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
      return getCurrentTenantId();
    });

    expect(observed).toBe("tenant-a");
  });

  it("does not leak the tenantId once the callback has returned", () => {
    runWithTenantContext("tenant-a", () => {
      /* no-op */
    });

    expect(getCurrentTenantId()).toBeUndefined();
  });

  it("keeps concurrent contexts isolated from each other (no cross-tenant leakage)", async () => {
    const [resultA, resultB] = await Promise.all([
      runWithTenantContext("tenant-a", async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return getCurrentTenantId();
      }),
      runWithTenantContext("tenant-b", async () => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        return getCurrentTenantId();
      }),
    ]);

    expect(resultA).toBe("tenant-a");
    expect(resultB).toBe("tenant-b");
  });

  it("supports nested contexts, restoring the outer tenantId after the inner one returns", () => {
    runWithTenantContext("tenant-outer", () => {
      expect(getCurrentTenantId()).toBe("tenant-outer");

      runWithTenantContext("tenant-inner", () => {
        expect(getCurrentTenantId()).toBe("tenant-inner");
      });

      expect(getCurrentTenantId()).toBe("tenant-outer");
    });
  });
});
