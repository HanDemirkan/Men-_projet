import { ROLES } from "@qr-platform/permissions";
import type { Role } from "@qr-platform/permissions";

export interface MockStat {
  label: string;
  value: string;
  trend?: { value: string; direction: "up" | "down" | "neutral" };
}

const STATS_BY_ROLE: Record<Role, MockStat[]> = {
  [ROLES.SUPER_ADMIN]: [
    { label: "Toplam İşletme", value: "128", trend: { value: "+4 bu ay", direction: "up" } },
    { label: "Aktif Kullanıcı", value: "1.024", trend: { value: "+12%", direction: "up" } },
    { label: "Aylık Gelir", value: "₺842.500", trend: { value: "+8%", direction: "up" } },
    { label: "Açık Destek Talebi", value: "6", trend: { value: "-2", direction: "down" } },
  ],
  [ROLES.TENANT_OWNER]: [
    { label: "Bugünkü Sipariş", value: "0", trend: { value: "Veri yok", direction: "neutral" } },
    { label: "Bugünkü Ciro", value: "₺0", trend: { value: "Veri yok", direction: "neutral" } },
    { label: "Aktif Şube", value: "3" },
    { label: "Aktif Personel", value: "18" },
  ],
  [ROLES.BRANCH_MANAGER]: [
    { label: "Bugünkü Sipariş", value: "0", trend: { value: "Veri yok", direction: "neutral" } },
    { label: "Bugünkü Ciro", value: "₺0", trend: { value: "Veri yok", direction: "neutral" } },
    { label: "Aktif Masa", value: "0/24" },
    { label: "Aktif Personel", value: "6" },
  ],
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
  return STATS_BY_ROLE[role];
}
