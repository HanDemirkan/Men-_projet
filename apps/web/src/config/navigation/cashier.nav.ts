import type { NavSection } from "@qr-platform/ui";
import { FileBarChart, LayoutDashboard, Receipt, Wallet } from "lucide-react";

import { ROUTES } from "@/config/routes";

export const CASHIER_NAV: NavSection[] = [
  {
    items: [{ label: "Genel Bakış", href: ROUTES.cashier, icon: LayoutDashboard }],
  },
  {
    title: "Kasa",
    items: [
      { label: "Kasa", href: `${ROUTES.cashier}#register`, icon: Wallet },
      { label: "Adisyonlar", href: `${ROUTES.cashier}#tickets`, icon: Receipt },
      { label: "Gün Sonu Raporu", href: `${ROUTES.cashier}#report`, icon: FileBarChart },
    ],
  },
];
