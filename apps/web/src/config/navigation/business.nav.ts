import type { NavSection } from "@qr-platform/ui";
import {
  BarChart3,
  LayoutDashboard,
  Settings,
  Store,
  UserCog,
  UtensilsCrossed,
} from "lucide-react";

import { ROUTES } from "@/config/routes";

export const BUSINESS_NAV: NavSection[] = [
  {
    items: [{ label: "Genel Bakış", href: ROUTES.business, icon: LayoutDashboard }],
  },
  {
    title: "İşletme",
    items: [
      { label: "Menü Yönetimi", href: `${ROUTES.business}#menu`, icon: UtensilsCrossed },
      { label: "Şubeler", href: `${ROUTES.business}#branches`, icon: Store },
      { label: "Personel", href: `${ROUTES.business}#staff`, icon: UserCog },
      { label: "Raporlar", href: `${ROUTES.business}#reports`, icon: BarChart3 },
    ],
  },
  {
    items: [{ label: "Ayarlar", href: `${ROUTES.business}#settings`, icon: Settings }],
  },
];
