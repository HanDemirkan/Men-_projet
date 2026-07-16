import type { NavSection } from "@qr-platform/ui";
import { CheckCircle2, ClipboardList, LayoutDashboard } from "lucide-react";

import { ROUTES } from "@/config/routes";

export const KITCHEN_NAV: NavSection[] = [
  {
    items: [{ label: "Genel Bakış", href: ROUTES.kitchen, icon: LayoutDashboard }],
  },
  {
    title: "Mutfak",
    items: [
      { label: "Sipariş Kuyruğu", href: `${ROUTES.kitchen}#queue`, icon: ClipboardList },
      { label: "Hazır Siparişler", href: `${ROUTES.kitchen}#ready`, icon: CheckCircle2 },
    ],
  },
];
