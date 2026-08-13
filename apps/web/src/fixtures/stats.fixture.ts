import { ROLES } from "@qr-platform/permissions";
import type { Role } from "@qr-platform/permissions";

export interface MockStat {
  label: string;
  value: string;
  trend?: { value: string; direction: "up" | "down" | "neutral" };
}

// SUPER_ADMIN has no entry here - its dashboard (/admin) is driven entirely
// by GET /admin/dashboard's real aggregates, not this mock fixture (see
// Sprint 4 "Mock admin metriği kalmıyor" requirement). TENANT_OWNER/
// BRANCH_MANAGER likewise have no entry as of Sprint 5 - their dashboard
// (/business) is driven by GET /business/dashboard's real aggregates.
const STATS_BY_ROLE: Partial<Record<Role, MockStat[]>> = {
  [ROLES.MENU_EDITOR]: [
    { label: "Menü Kategorisi", value: "0" },
    { label: "Ürün Sayısı", value: "0" },
    { label: "Taslak Değişiklik", value: "0" },
  ],
  [ROLES.CASHIER]: [
    { label: "Açık Adisyon", value: "0" },
    { label: "Bugünkü Tahsilat", value: "₺0" },
    { label: "Vardiya Süresi", value: "00:00" },
  ],
  [ROLES.WAITER]: [
    { label: "Bana Atanan Masa", value: "0" },
    { label: "Bekleyen Sipariş", value: "0" },
    { label: "Servis Edilen (Bugün)", value: "0" },
  ],
  [ROLES.KITCHEN]: [
    { label: "Bekleyen Sipariş", value: "0" },
    { label: "Hazırlanıyor", value: "0" },
    { label: "Ortalama Hazırlık", value: "—" },
  ],
};

export function getMockStats(role: Role): MockStat[] {
  return STATS_BY_ROLE[role] ?? [];
}
