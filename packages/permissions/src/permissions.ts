export const PERMISSIONS = {
  TENANT_READ: "tenant.read",
  TENANT_UPDATE: "tenant.update",
  BRANCH_READ: "branch.read",
  BRANCH_UPDATE: "branch.update",
  MENU_READ: "menu.read",
  MENU_WRITE: "menu.write",
  PRODUCT_READ: "product.read",
  PRODUCT_WRITE: "product.write",
  ORDER_READ: "order.read",
  ORDER_WRITE: "order.write",
  CASHIER_PAYMENT: "cashier.payment",
  REPORT_VIEW: "report.view",
  USER_INVITE: "user.invite",
  ROLE_MANAGE: "role.manage",
  PERMISSION_MANAGE: "permission.manage",
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const PERMISSION_VALUES: PermissionCode[] = Object.values(PERMISSIONS);

export const PERMISSION_GROUPS: Record<PermissionCode, string> = {
  [PERMISSIONS.TENANT_READ]: "tenant",
  [PERMISSIONS.TENANT_UPDATE]: "tenant",
  [PERMISSIONS.BRANCH_READ]: "branch",
  [PERMISSIONS.BRANCH_UPDATE]: "branch",
  [PERMISSIONS.MENU_READ]: "menu",
  [PERMISSIONS.MENU_WRITE]: "menu",
  [PERMISSIONS.PRODUCT_READ]: "product",
  [PERMISSIONS.PRODUCT_WRITE]: "product",
  [PERMISSIONS.ORDER_READ]: "order",
  [PERMISSIONS.ORDER_WRITE]: "order",
  [PERMISSIONS.CASHIER_PAYMENT]: "cashier",
  [PERMISSIONS.REPORT_VIEW]: "report",
  [PERMISSIONS.USER_INVITE]: "user",
  [PERMISSIONS.ROLE_MANAGE]: "role",
  [PERMISSIONS.PERMISSION_MANAGE]: "permission",
};
