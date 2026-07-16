import type { NavSection } from "@qr-platform/ui";
import { Building2, CreditCard, LayoutDashboard, LifeBuoy, Settings, Users } from "lucide-react";

import { ROUTES } from "@/config/routes";

export const ADMIN_NAV: NavSection[] = [
  {
    items: [{ label: "Genel Bakış", href: ROUTES.admin, icon: LayoutDashboard }],
  },
  {
    title: "Platform",
    items: [
      { label: "İşletmeler", href: `${ROUTES.admin}#tenants`, icon: Building2 },
      { label: "Kullanıcılar", href: `${ROUTES.admin}#users`, icon: Users },
      { label: "Faturalandırma", href: `${ROUTES.admin}#billing`, icon: CreditCard },
      { label: "Destek Talepleri", href: `${ROUTES.admin}#support`, icon: LifeBuoy, badge: "6" },
    ],
  },
  {
    items: [{ label: "Sistem Ayarları", href: `${ROUTES.admin}#settings`, icon: Settings }],
  },
];
