import { ROLES } from "@qr-platform/permissions";
import type { ReactNode } from "react";

import { PanelLayout } from "@/layouts/PanelLayout";

export default function AdminRouteLayout({ children }: { children: ReactNode }) {
  return <PanelLayout role={ROLES.SUPER_ADMIN}>{children}</PanelLayout>;
}
