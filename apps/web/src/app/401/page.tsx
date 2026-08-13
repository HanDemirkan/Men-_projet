import { Button, EmptyState, Logo } from "@qr-platform/ui";
import { LockKeyhole } from "lucide-react";
import Link from "next/link";

import { ROUTES } from "@/config/routes";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-10 px-6 py-12">
      <Link href={ROUTES.home}>
        <Logo size="md" />
      </Link>
      <EmptyState
        icon={LockKeyhole}
        title="Kimlik doğrulama gerekli"
        description="Bu sayfayı görüntülemek için giriş yapmanız gerekiyor."
        action={
          <Button asChild>
            <Link href={ROUTES.login}>Giriş yap</Link>
          </Button>
        }
      />
    </div>
  );
}
