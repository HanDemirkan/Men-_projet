import { Button, EmptyState, Logo } from "@qr-platform/ui";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";

import { ROUTES } from "@/config/routes";

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-10 px-6 py-12">
      <Link href={ROUTES.home}>
        <Logo size="md" />
      </Link>
      <EmptyState
        icon={ShieldAlert}
        title="Bu sayfaya erişim yetkiniz yok"
        description="Hesabınızın rolü bu paneli görüntülemek için yeterli değil."
        action={
          <Button asChild variant="outline">
            <Link href={ROUTES.login}>Girişe dön</Link>
          </Button>
        }
      />
    </div>
  );
}
