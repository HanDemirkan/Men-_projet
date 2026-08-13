import { Button, EmptyState, Logo } from "@qr-platform/ui";
import { Store } from "lucide-react";
import Link from "next/link";

import { ROUTES } from "@/config/routes";

// Covers every notFound() call under /[tenantSlug]/** - unknown tenant slug,
// unpublished/inactive category, unavailable product, etc. (see
// PublicStorefrontService's published-filter rules) - a customer scanning a
// stale or mistyped QR code sees this instead of Next's bare default 404.
export default function TenantNotFoundPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-10 px-6 py-12">
      <Link href={ROUTES.home}>
        <Logo size="md" />
      </Link>
      <EmptyState
        icon={Store}
        title="Bu işletme sayfası bulunamadı"
        description="Aradığınız işletme, menü ya da ürün mevcut değil. QR kodu tekrar okutmayı deneyebilirsiniz."
        action={
          <Button asChild variant="outline">
            <Link href={ROUTES.home}>QR Platform'a git</Link>
          </Button>
        }
      />
    </div>
  );
}
