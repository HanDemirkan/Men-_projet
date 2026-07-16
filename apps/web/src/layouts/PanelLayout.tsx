"use client";

import type { Role } from "@qr-platform/permissions";
import {
  Breadcrumb,
  Drawer,
  DrawerContent,
  Header,
  Logo,
  Sidebar,
  SidebarNav,
} from "@qr-platform/ui";
import type { LinkComponent } from "@qr-platform/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { ReactNode } from "react";

import { NAV_CONFIG } from "@/config/navigation";
import { PANEL_TITLES } from "@/config/navigation/panel-titles";
import { MOCK_NOTIFICATIONS } from "@/fixtures/notifications.fixture";
import { getCurrentUser } from "@/services/mock/user.service";
import { NotificationBell } from "@/shared/components/NotificationBell";
import { UserMenu } from "@/shared/components/UserMenu";

const NextLink: LinkComponent = ({ href, className, children, onClick }) => (
  <Link href={href} className={className} onClick={onClick}>
    {children}
  </Link>
);

export interface PanelLayoutProps {
  role: Role;
  children: ReactNode;
}

export function PanelLayout({ role, children }: PanelLayoutProps) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const sections = NAV_CONFIG[role];
  const title = PANEL_TITLES[role];
  const user = getCurrentUser(role);

  return (
    <div className="flex min-h-dvh bg-muted/30">
      <div className="hidden lg:flex">
        <Sidebar
          header={<Logo size="sm" />}
          sections={sections}
          activePath={pathname}
          linkComponent={NextLink}
        />
      </div>

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent side="left" className="max-w-72">
          <Logo size="sm" />
          <SidebarNav
            sections={sections}
            activePath={pathname}
            linkComponent={NextLink}
            onNavigate={() => setDrawerOpen(false)}
          />
        </DrawerContent>
      </Drawer>

      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          onMenuClick={() => setDrawerOpen(true)}
          breadcrumb={<Breadcrumb items={[{ label: title }]} />}
          actions={
            <>
              <NotificationBell notifications={MOCK_NOTIFICATIONS} />
              <UserMenu user={user} />
            </>
          }
        />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
