import { ROLES } from "@qr-platform/permissions";
import type { ReactNode } from "react";

import { PanelLayout } from "@/layouts/PanelLayout";

export default function KitchenRouteLayout({ children }: { children: ReactNode }) {
  return <PanelLayout role={ROLES.KITCHEN}>{children}</PanelLayout>;
}
