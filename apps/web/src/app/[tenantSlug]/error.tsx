"use client";

import { Button, EmptyState, Logo } from "@qr-platform/ui";
import { WifiOff } from "lucide-react";
import { useEffect } from "react";

// Covers a thrown error anywhere under /[tenantSlug]/** - typically the API
// being unreachable, not a missing-tenant case (that's not-found.tsx via
// notFound(), a different Next.js mechanism). No sidebar/panel chrome here -
// this is the public storefront, styled like the rest of it, not the admin
// panel's PanelError.
export default function TenantErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-10 px-6 py-12">
      <Logo size="md" />
      <EmptyState
        icon={WifiOff}
        title="Şu anda bu sayfaya ulaşılamıyor"
        description="Bir bağlantı sorunu oluştu. Lütfen birkaç saniye sonra tekrar deneyin."
        action={
          <Button variant="outline" onClick={() => reset()}>
            Tekrar Dene
          </Button>
        }
      />
    </div>
  );
}
