import { ROLES } from "@qr-platform/permissions";
import type { ReactNode } from "react";

import { PanelLayout } from "@/layouts/PanelLayout";

export default function BusinessRouteLayout({ children }: { children: ReactNode }) {
  return <PanelLayout role={ROLES.TENANT_OWNER}>{children}</PanelLayout>;
}
