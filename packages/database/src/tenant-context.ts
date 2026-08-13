import { AsyncLocalStorage } from "node:async_hooks";

export interface TenantContext {
  tenantId: string;
}

// Carries the current request's tenant through the whole async call stack
// without threading a `tenantId` parameter through every service method.
// `tenant-scoped-client.ts` reads this to enforce isolation at the Prisma
// Client level - this is the single source of truth for "which tenant is
// this query allowed to touch".
const tenantContextStorage = new AsyncLocalStorage<TenantContext>();

export function runWithTenantContext<T>(tenantId: string, fn: () => T): T {
  return tenantContextStorage.run({ tenantId }, () => {
    const result = fn();

    // Prisma's extended-client queries (tenantScopedPrisma.*) are lazy
    // thenables: calling e.g. `.findMany()` does nothing by itself, the
    // Client Extension (and therefore the tenant check) only runs once
    // `.then()` is invoked. AsyncLocalStorage only follows continuations
    // chained *during* this synchronous run() window - if `fn()` merely
    // returns that un-awaited promise for the caller to `await` afterward
    // (the natural way to write `runWithTenantContext(id, () =>
    // tenantScopedPrisma.branch.findMany())`), the context would already be
    // gone by the time `.then()` actually fires. Resolving it here, while
    // still inside the window, is what makes that natural call pattern safe.
    if (isThenable(result)) {
      return Promise.resolve(result) as unknown as T;
    }

    return result;
  });
}

function isThenable(value: unknown): value is PromiseLike<unknown> {
  return typeof value === "object" && value !== null && typeof (value as { then?: unknown }).then === "function";
}

export function getCurrentTenantId(): string | undefined {
  return tenantContextStorage.getStore()?.tenantId;
}
