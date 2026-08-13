import type { NavSection } from "@qr-platform/ui";
import { Building2, ClipboardList, CreditCard, LayoutDashboard, LifeBuoy, Settings, Users } from "lucide-react";

import { ROUTES } from "@/config/routes";

export const ADMIN_NAV: NavSection[] = [
  {
    items: [{ label: "Genel Bakış", href: ROUTES.admin, icon: LayoutDashboard }],
  },
  {
    title: "Platform",
    items: [
      { label: "İşletmeler", href: ROUTES.adminTenants, icon: Building2 },
      { label: "Kullanıcılar", href: ROUTES.adminUsers, icon: Users },
      { label: "Audit Log", href: ROUTES.adminAuditLogs, icon: ClipboardList },
      // Billing/support have no real backing domain yet - shown as disabled
      // rather than removed, so it's clear they're planned, not missing.
      { label: "Faturalandırma", href: ROUTES.admin, icon: CreditCard, badge: "Yakında", disabled: true },
      { label: "Destek Talepleri", href: ROUTES.adminSupport, icon: LifeBuoy },
    ],
  },
  {
    items: [{ label: "Sistem Durumu", href: ROUTES.adminSystem, icon: Settings }],
  },
];
