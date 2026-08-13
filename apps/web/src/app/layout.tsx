import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import type { ReactNode } from "react";

import { AppProviders } from "@/providers/AppProviders";
import { SkipLink } from "@/shared/components/SkipLink";

import "../styles/globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

// Sprint 8 visual redesign: a distinct heading face gives the panel real
// typographic hierarchy instead of Inter-everywhere (screens read as
// "generic admin template" otherwise) - Sora's slightly wider, more
// geometric letterforms read as confident at display sizes while staying
// legible down to h3, and its 600/700 weights hold up in both themes.
// Body copy and data stay on Inter, which is the better choice for dense
// tables/forms at small sizes.
const sora = Sora({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sora",
  display: "swap",
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "QR Platform",
  description: "QR Menü ve İşletme Operasyon Platformu",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr" className={`${inter.variable} ${sora.variable}`}>
      <body className="min-h-dvh bg-background font-sans text-foreground antialiased">
        <SkipLink />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
