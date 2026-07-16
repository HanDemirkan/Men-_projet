export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  TENANT_OWNER: "TENANT_OWNER",
  BRANCH_MANAGER: "BRANCH_MANAGER",
  CASHIER: "CASHIER",
  WAITER: "WAITER",
  KITCHEN: "KITCHEN",
  MENU_EDITOR: "MENU_EDITOR",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_VALUES: Role[] = Object.values(ROLES);
