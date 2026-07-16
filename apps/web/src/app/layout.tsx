import type { Metadata } from "next";

import "../styles/globals.css";

export const metadata: Metadata = {
  title: "QR Platform",
  description: "QR Menü ve İşletme Operasyon Platformu",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="min-h-screen bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
