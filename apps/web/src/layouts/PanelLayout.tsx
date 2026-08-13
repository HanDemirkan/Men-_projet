"use client";

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
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import { NAV_CONFIG } from "@/config/navigation";
import { PANEL_TITLES } from "@/config/navigation/panel-titles";
import { MOCK_NOTIFICATIONS } from "@/fixtures/notifications.fixture";
import { NotificationBell } from "@/shared/components/NotificationBell";
import { UserMenu } from "@/shared/components/UserMenu";
import type { AuthUser } from "@/types/auth";

const NextLink: LinkComponent = ({ href, className, children, onClick, "aria-label": ariaLabel }) => (
  <Link href={href} className={className} onClick={onClick} aria-label={ariaLabel}>
    {children}
  </Link>
);

const SIDEBAR_COLLAPSED_STORAGE_KEY = "qr-platform:sidebar-collapsed";

export interface PanelLayoutProps {
  user: AuthUser;
  children: ReactNode;
}

export function PanelLayout({ user, children }: PanelLayoutProps) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  // Starts false so server/client markup match on first paint - the real
  // (possibly true) value is applied right after mount, from localStorage.
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === "true");
  }, []);

  const toggleCollapsed = (next: boolean): void => {
    setCollapsed(next);
    window.localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(next));
  };

  const sections = NAV_CONFIG[user.role];
  const title = PANEL_TITLES[user.role];

  return (
    <div className="flex min-h-dvh bg-muted/30">
      <div className="hidden lg:flex">
        <Sidebar
          header={<Logo size="sm" iconOnly={collapsed} />}
          sections={sections}
          activePath={pathname}
          linkComponent={NextLink}
          collapsed={collapsed}
          onCollapsedChange={toggleCollapsed}
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
        <main id="main-content" tabIndex={-1} className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {/* Sprint 8: no longer wraps content in PageTransition - a real
              user-feedback pass found the opacity-gated fade on every panel
              navigation read as "click, nothing happens, then it opens" (a
              perceived-latency cost, not just a cosmetic flourish), on top
              of the exact class of Lighthouse NO_FCP risk already found and
              fixed on the public storefront route in Sprint 7. Route changes
              now render immediately; hover/press feedback and loading states
              carry the "something happened" signal instead. */}
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
