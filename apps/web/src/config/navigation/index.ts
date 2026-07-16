import { ROLES } from "@qr-platform/permissions";
import type { Role } from "@qr-platform/permissions";
import type { NavSection } from "@qr-platform/ui";

import { ADMIN_NAV } from "./admin.nav";
import { BUSINESS_NAV } from "./business.nav";
import { CASHIER_NAV } from "./cashier.nav";
import { KITCHEN_NAV } from "./kitchen.nav";
import { WAITER_NAV } from "./waiter.nav";

// Role -> nav lookup. A plain Record, not if/switch: adding a role only ever
// means adding a key here. TENANT_OWNER/BRANCH_MANAGER/MENU_EDITOR share one
// config because they're all "business side" from a navigation standpoint.
export const NAV_CONFIG: Record<Role, NavSection[]> = {
  [ROLES.SUPER_ADMIN]: ADMIN_NAV,
  [ROLES.TENANT_OWNER]: BUSINESS_NAV,
  [ROLES.BRANCH_MANAGER]: BUSINESS_NAV,
  [ROLES.MENU_EDITOR]: BUSINESS_NAV,
  [ROLES.CASHIER]: CASHIER_NAV,
  [ROLES.WAITER]: WAITER_NAV,
  [ROLES.KITCHEN]: KITCHEN_NAV,
};
