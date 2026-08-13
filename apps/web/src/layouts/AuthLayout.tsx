import { Logo } from "@qr-platform/ui";
import Link from "next/link";
import type { ReactNode } from "react";

import { ROUTES } from "@/config/routes";

export interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-foreground p-10 text-background lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, hsl(var(--primary)) 0%, transparent 45%), radial-gradient(circle at 80% 70%, hsl(var(--primary)) 0%, transparent 40%)",
          }}
          aria-hidden="true"
        />
        <Link href={ROUTES.home} className="relative z-10 text-background">
          <Logo size="md" />
        </Link>
        <div className="relative z-10 flex flex-col gap-4">
          <p className="text-3xl font-semibold leading-tight tracking-tight">
            İşletmenizi tek platformdan yönetin.
          </p>
          <p className="max-w-md text-sm text-background/70">
            Dijital menü, sipariş, kasa ve operasyon yönetimini tek bir panelden kontrol edin.
          </p>
        </div>
        <p className="relative z-10 text-xs text-background/50">
          © {new Date().getFullYear()} QR Platform. Tüm hakları saklıdır.
        </p>
      </div>

      <main
        id="main-content"
        tabIndex={-1}
        className="flex flex-col items-center justify-center px-6 py-12 sm:px-12"
      >
        <div className="mb-10 lg:hidden">
          <Link href={ROUTES.home}>
            <Logo size="md" />
          </Link>
        </div>
        {/* Sprint 8: no opacity-gated page-wide entrance - see PanelLayout's
            comment for why (perceived latency + Lighthouse NO_FCP risk). */}
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
