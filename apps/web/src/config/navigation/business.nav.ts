import type { NavSection } from "@qr-platform/ui";
import {
  Activity,
  Image as ImageIcon,
  LayoutDashboard,
  ListTree,
  QrCode,
  Search,
  Settings,
  SlidersHorizontal,
  Store,
  Tag,
  UserCog,
  UtensilsCrossed,
} from "lucide-react";

import { ROUTES } from "@/config/routes";

export const BUSINESS_NAV: NavSection[] = [
  {
    items: [{ label: "Genel Bakış", href: ROUTES.business, icon: LayoutDashboard }],
  },
  {
    title: "Menü",
    items: [
      { label: "Menüler", href: ROUTES.businessMenus, icon: UtensilsCrossed },
      { label: "Kategoriler", href: ROUTES.businessCategories, icon: ListTree },
      { label: "Ürünler", href: ROUTES.businessProducts, icon: Tag },
      { label: "Medya Kütüphanesi", href: ROUTES.businessMedia, icon: ImageIcon },
      { label: "Arama", href: ROUTES.businessSearch, icon: Search },
    ],
  },
  {
    title: "İşletme",
    items: [
      { label: "Şubeler", href: ROUTES.businessBranches, icon: Store },
      { label: "Personel", href: ROUTES.businessUsers, icon: UserCog },
      { label: "Aktivite", href: ROUTES.businessActivity, icon: Activity },
    ],
  },
  {
    items: [
      { label: "İşletme Profili", href: ROUTES.businessProfile, icon: Settings },
      { label: "QR & Storefront", href: ROUTES.businessStorefront, icon: QrCode },
      { label: "Ayarlar", href: ROUTES.businessSettings, icon: SlidersHorizontal },
    ],
  },
];
