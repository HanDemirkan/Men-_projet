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
const TENANT_SCOPED_MODELS = new Set(["Branch", "TenantUser"]);

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
