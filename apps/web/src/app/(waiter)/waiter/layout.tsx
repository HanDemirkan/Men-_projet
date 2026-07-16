import { ROLES } from "@qr-platform/permissions";
import type { ReactNode } from "react";

import { PanelLayout } from "@/layouts/PanelLayout";

export default function WaiterRouteLayout({ children }: { children: ReactNode }) {
  return <PanelLayout role={ROLES.WAITER}>{children}</PanelLayout>;
}
