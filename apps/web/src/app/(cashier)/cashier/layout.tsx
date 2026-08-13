import { ROLES } from "@qr-platform/permissions";
import type { ReactNode } from "react";

import { PanelLayout } from "@/layouts/PanelLayout";
import { requireUser } from "@/lib/auth/require-user";

export default async function CashierRouteLayout({ children }: { children: ReactNode }) {
  const user = await requireUser([ROLES.CASHIER]);
  return <PanelLayout user={user}>{children}</PanelLayout>;
}
