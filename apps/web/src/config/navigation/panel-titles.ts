import { ROLES } from "@qr-platform/permissions";
import type { Role } from "@qr-platform/permissions";

export const PANEL_TITLES: Record<Role, string> = {
  [ROLES.SUPER_ADMIN]: "Süper Admin Paneli",
  [ROLES.TENANT_OWNER]: "İşletme Paneli",
  [ROLES.BRANCH_MANAGER]: "İşletme Paneli",
  [ROLES.MENU_EDITOR]: "İşletme Paneli",
  [ROLES.CASHIER]: "Kasa Paneli",
  [ROLES.WAITER]: "Garson Paneli",
  [ROLES.KITCHEN]: "Mutfak Paneli",
};
