import { ROLES } from "@qr-platform/permissions";
import type { ReactNode } from "react";

import { PanelLayout } from "@/layouts/PanelLayout";
import { requireUser } from "@/lib/auth/require-user";

export default async function AdminRouteLayout({ children }: { children: ReactNode }) {
  const user = await requireUser([ROLES.SUPER_ADMIN]);
  return <PanelLayout user={user}>{children}</PanelLayout>;
}
