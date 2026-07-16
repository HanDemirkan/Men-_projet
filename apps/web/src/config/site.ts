export const SITE = {
  name: "QR Platform",
  description: "İşletmenizi tek platformdan yönetin: dijital menü, sipariş, kasa ve operasyon.",
  nav: [
    { label: "Özellikler", href: "#features" },
    { label: "Nasıl Çalışır", href: "#how-it-works" },
    { label: "Neden Biz", href: "#why-choose" },
    { label: "SSS", href: "#faq" },
  ],
  footerLinks: {
    product: [
      { label: "Özellikler", href: "#features" },
      { label: "Nasıl Çalışır", href: "#how-it-works" },
      { label: "SSS", href: "#faq" },
    ],
    company: [
      { label: "Giriş Yap", href: "/login" },
      { label: "Sistem Durumu", href: "/health" },
    ],
  },
} as const;
