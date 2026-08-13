import { ROLES } from "@qr-platform/permissions";
import type { ReactNode } from "react";

import { PanelLayout } from "@/layouts/PanelLayout";
import { requireUser } from "@/lib/auth/require-user";

export default async function BusinessRouteLayout({ children }: { children: ReactNode }) {
  const user = await requireUser([ROLES.TENANT_OWNER, ROLES.BRANCH_MANAGER, ROLES.MENU_EDITOR]);
  return <PanelLayout user={user}>{children}</PanelLayout>;
}
