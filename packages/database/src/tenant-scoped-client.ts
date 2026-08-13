import { prisma } from "./client";
import { getCurrentTenantId } from "./tenant-context";

// The central tenant isolation mechanism (see docs/decisions/0007). Every
// model listed here has its `where`/`data` automatically stamped with the
// current request's tenantId at the Prisma Client level - no service or
// controller ever writes `where: { tenantId }` by hand, so it cannot be
// forgotten in review. Adding a new tenant-owned table (menu, product,
// order, ...) means adding its Prisma model name to this one list.
//
// Deliberately excluded: `Role` and `AuditLog` have intentionally nullable
// tenantId (system roles / platform-level audit entries are shared across
// tenants) - blanket-scoping them would hide legitimate shared rows. Any
// tenant-scoped filtering those two need is done explicitly, case by case.
// `User` is excluded because a user is a global identity, not tenant-owned
// data; tenant-scoped access to a user always goes through `TenantUser`.
// `Tenant` itself is excluded (it IS the tenant, not tenant-owned data) -
// business-profile code filters by id via `CurrentTenant()` directly.
//
// Sprint 3A adds every Business Profile / Menu domain model here - see ADR
// 0008. `Media`'s public file-streaming endpoints are the one documented
// exception, using the raw `prisma` export instead (no tenant context
// exists for an anonymous request) - same pattern as AuditService/
// IdentityService in ADR 0007.
//
// Sprint 5 adds `StorefrontView` - PublicStorefrontContextMiddleware already
// establishes real tenant context (resolved from the URL's :tenantSlug, see
// ADR 0009) for every public storefront request, so its view-tracking insert
// goes through tenantScopedPrisma like any other tenant-owned write, not the
// Media-style raw-prisma exception.
//
// Sprint 7 adds `TenantStorefrontConfig` (its `tenantId` field IS the @id,
// which this scoping mechanism handles the same as any other tenantId field
// - findUnique/upsert/create all key off it correctly) and
// `StorefrontConfigRevision`, extracted off Tenant for the template rewrite.
// Also adds `TenantSlugAlias` (QR permanence) - listed here for authenticated
// tenant-scoped access (e.g. a future "redirect history" panel), but its one
// public-facing lookup (resolving an unknown incoming slug to a tenant, in
// PublicStorefrontContextMiddleware) necessarily happens *before* any tenant
// context exists, so that one read goes through the raw `prisma` export
// instead - same documented exception as the public Tenant lookup right next
// to it (see ADR 0009).
const TENANT_SCOPED_MODELS = new Set([
  "Branch",
  "TenantUser",
  "Media",
  "Menu",
  "Category",
  "Product",
  "Variant",
  "OptionGroup",
  "Option",
  "StorefrontView",
  "TenantStorefrontConfig",
  "StorefrontConfigRevision",
  "TenantSlugAlias",
]);

const WHERE_OPERATIONS = new Set([
  "findUnique",
  "findUniqueOrThrow",
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "update",
  "updateMany",
  "delete",
  "deleteMany",
  "count",
  "aggregate",
  "groupBy",
]);

function requireTenantId(model: string, operation: string): string {
  const tenantId = getCurrentTenantId();

  if (!tenantId) {
    throw new Error(
      `Tenant context missing for scoped query ${model}.${operation}(). ` +
        "This model is tenant-owned - every access must run inside runWithTenantContext(). " +
        "If this is a legitimate cross-tenant/platform operation, use the unscoped `prisma` export explicitly.",
    );
  }

  return tenantId;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma's $allOperations args shape is a large generated union; narrowing it per-operation below is intentionally structural, not typed.
type OperationArgs = Record<string, any>;

export const tenantScopedPrisma = prisma.$extends({
  name: "tenant-scoping",
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        if (!TENANT_SCOPED_MODELS.has(model)) {
          return query(args);
        }

        const tenantId = requireTenantId(model, operation);
        const scopedArgs: OperationArgs = args ?? {};

        if (operation === "create") {
          scopedArgs["data"] = { ...scopedArgs["data"], tenantId };
        } else if (operation === "createMany") {
          const data: unknown = scopedArgs["data"];
          scopedArgs["data"] = Array.isArray(data)
            ? data.map((row: OperationArgs) => ({ ...row, tenantId }))
            : { ...(data as OperationArgs), tenantId };
        } else if (operation === "upsert") {
          scopedArgs["where"] = { ...scopedArgs["where"], tenantId };
          scopedArgs["create"] = { ...scopedArgs["create"], tenantId };
        } else if (WHERE_OPERATIONS.has(operation)) {
          scopedArgs["where"] = { ...scopedArgs["where"], tenantId };
        }

        return query(scopedArgs);
      },
    },
  },
});

export type TenantScopedPrismaClient = typeof tenantScopedPrisma;
