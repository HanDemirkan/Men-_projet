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
  return tenantContextStorage.run({ tenantId }, fn);
}

export function getCurrentTenantId(): string | undefined {
  return tenantContextStorage.getStore()?.tenantId;
}
