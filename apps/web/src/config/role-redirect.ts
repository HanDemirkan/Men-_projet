import { ROLES } from "@qr-platform/permissions";
import type { Role } from "@qr-platform/permissions";

import { ROUTES } from "./routes";

// Role -> post-login destination. A plain Record, not if/switch: adding a
// role only ever means adding a key here. TENANT_OWNER/BRANCH_MANAGER/
// MENU_EDITOR share the business panel, matching NAV_CONFIG's grouping.
export const ROLE_REDIRECT: Record<Role, string> = {
  [ROLES.SUPER_ADMIN]: ROUTES.admin,
  [ROLES.TENANT_OWNER]: ROUTES.business,
  [ROLES.BRANCH_MANAGER]: ROUTES.business,
  [ROLES.MENU_EDITOR]: ROUTES.business,
  [ROLES.CASHIER]: ROUTES.cashier,
  [ROLES.WAITER]: ROUTES.waiter,
  [ROLES.KITCHEN]: ROUTES.kitchen,
};
