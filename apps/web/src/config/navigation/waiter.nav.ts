import type { NavSection } from "@qr-platform/ui";
import { Bell, ClipboardList, LayoutDashboard, Table2 } from "lucide-react";

import { ROUTES } from "@/config/routes";

export const WAITER_NAV: NavSection[] = [
  {
    items: [{ label: "Genel Bakış", href: ROUTES.waiter, icon: LayoutDashboard }],
  },
  {
    title: "Servis",
    items: [
      { label: "Masalar", href: `${ROUTES.waiter}#tables`, icon: Table2 },
      { label: "Siparişler", href: `${ROUTES.waiter}#orders`, icon: ClipboardList },
      { label: "Bildirimler", href: `${ROUTES.waiter}#notifications`, icon: Bell },
    ],
  },
];
