import { ROLES } from "@qr-platform/permissions";
import type { Role } from "@qr-platform/permissions";

import type { MockUser } from "@/types/user";

const MOCK_USERS: Record<Role, MockUser> = {
  [ROLES.SUPER_ADMIN]: {
    name: "Elif Aydın",
    email: "elif.aydin@qrplatform.dev",
    role: ROLES.SUPER_ADMIN,
    initials: "EA",
  },
  [ROLES.TENANT_OWNER]: {
    name: "Mert Kaya",
    email: "mert.kaya@sahil-cafe.dev",
    role: ROLES.TENANT_OWNER,
    initials: "MK",
  },
  [ROLES.BRANCH_MANAGER]: {
    name: "Zeynep Demir",
    email: "zeynep.demir@sahil-cafe.dev",
    role: ROLES.BRANCH_MANAGER,
    initials: "ZD",
  },
  [ROLES.MENU_EDITOR]: {
    name: "Can Öz",
    email: "can.oz@sahil-cafe.dev",
    role: ROLES.MENU_EDITOR,
    initials: "CÖ",
  },
  [ROLES.CASHIER]: {
    name: "Ayşe Yıldız",
    email: "ayse.yildiz@sahil-cafe.dev",
    role: ROLES.CASHIER,
    initials: "AY",
  },
  [ROLES.WAITER]: {
    name: "Burak Şahin",
    email: "burak.sahin@sahil-cafe.dev",
    role: ROLES.WAITER,
    initials: "BŞ",
  },
  [ROLES.KITCHEN]: {
    name: "Deniz Arslan",
    email: "deniz.arslan@sahil-cafe.dev",
    role: ROLES.KITCHEN,
    initials: "DA",
  },
};

export function getMockUser(role: Role): MockUser {
  return MOCK_USERS[role];
}
