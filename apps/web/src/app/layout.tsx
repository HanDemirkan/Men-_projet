import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";

import { AppProviders } from "@/providers/AppProviders";

import "../styles/globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "QR Platform",
  description: "QR Menü ve İşletme Operasyon Platformu",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr" className={inter.variable}>
      <body className="min-h-dvh bg-background font-sans text-foreground antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
