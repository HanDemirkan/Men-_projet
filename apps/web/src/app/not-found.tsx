import { Button, EmptyState, Logo } from "@qr-platform/ui";
import { Compass } from "lucide-react";
import Link from "next/link";

import { ROUTES } from "@/config/routes";

// Root-level catch-all for any URL that matches nothing - Next.js's own
// default 404 is a bare, unstyled text page; this replaces it everywhere a
// more specific not-found.tsx (e.g. [tenantSlug]'s) doesn't already apply.
export default function NotFoundPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-10 px-6 py-12">
      <Link href={ROUTES.home}>
        <Logo size="md" />
      </Link>
      <EmptyState
        icon={Compass}
        title="Sayfa bulunamadı"
        description="Aradığınız sayfa mevcut değil ya da kaldırılmış olabilir."
        action={
          <Button asChild variant="outline">
            <Link href={ROUTES.home}>Ana sayfaya dön</Link>
          </Button>
        }
      />
    </div>
  );
}
