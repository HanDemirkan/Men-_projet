"use client";

import { motion } from "framer-motion";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "../lib/cn";
import { duration, easing } from "../motion";
import type { LinkComponent, NavSection } from "../types/navigation";

import { Badge } from "./Badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "./Tooltip";

const ACTIVE_INDICATOR_LAYOUT_ID = "sidebar-active-indicator";

export interface SidebarNavProps {
  sections: NavSection[];
  activePath: string;
  linkComponent?: LinkComponent;
  onNavigate?: () => void;
  className?: string;
  // Icon-only rail mode (desktop Sidebar only - the mobile Drawer always
  // renders full labels, since it's a temporary overlay, not persistent
  // chrome worth compacting).
  collapsed?: boolean;
}

function isActive(itemHref: string, activePath: string): boolean {
  return activePath === itemHref || activePath.startsWith(`${itemHref}/`);
}

// The nav list itself, decoupled from the surrounding chrome (width, border,
// fixed positioning) so `PanelLayout` can render the exact same markup both
// in the persistent desktop `Sidebar` and inside the mobile `Drawer` -
// avoiding two hand-maintained copies of the navigation.
export function SidebarNav({
  sections,
  activePath,
  linkComponent,
  onNavigate,
  className,
  collapsed = false,
}: SidebarNavProps) {
  const Anchor = linkComponent;

  return (
    <nav className={cn("flex flex-col gap-6", className)}>
      {sections.map((section, sectionIndex) => (
        <div key={section.title ?? sectionIndex} className="flex flex-col gap-1">
          {section.title && !collapsed ? (
            <p className="px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {section.title}
            </p>
          ) : null}
          {section.items.map((item) => {
            const active = !item.disabled && isActive(item.href, activePath);
            const Icon = item.icon;
            const content = (
              <span
                className={cn(
                  "relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-fast ease-standard",
                  collapsed && "justify-center px-2",
                  item.disabled
                    ? "cursor-not-allowed text-muted-foreground/50"
                    : active
                      ? "text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                {active ? (
                  <motion.span
                    layoutId={ACTIVE_INDICATOR_LAYOUT_ID}
                    className="absolute inset-0 rounded-md bg-accent"
                    style={{ zIndex: 0 }}
                    transition={{ duration: duration.normal, ease: easing.standard }}
                  />
                ) : null}
                <Icon className="relative z-10 h-4 w-4 shrink-0" aria-hidden="true" />
                {!collapsed ? (
                  <>
                    <span className="relative z-10 flex-1 truncate">{item.label}</span>
                    {item.badge ? (
                      <Badge
                        variant={active ? "default" : "secondary"}
                        className="relative z-10 px-1.5 py-0 text-[10px]"
                      >
                        {item.badge}
                      </Badge>
                    ) : null}
                  </>
                ) : null}
              </span>
            );

            if (item.disabled) {
              return (
                <span key={item.href} aria-disabled="true">
                  {content}
                </span>
              );
            }

            // Collapsed mode hides the visible label (icon-only), so the
            // link needs an explicit accessible name - otherwise it has
            // none at all for screen readers (the icon is aria-hidden).
            const accessibleName = collapsed ? item.label : undefined;

            const link = Anchor ? (
              <Anchor
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                aria-label={accessibleName}
              >
                {content}
              </Anchor>
            ) : (
              <a
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                aria-label={accessibleName}
              >
                {content}
              </a>
            );

            if (!collapsed) {
              return link;
            }

            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

export interface SidebarProps extends SidebarNavProps {
  header?: ReactNode;
  footer?: ReactNode;
  onCollapsedChange?: (collapsed: boolean) => void;
}

const EXPANDED_WIDTH = 256;
const COLLAPSED_WIDTH = 72;

// Persistent desktop sidebar (rendered by `PanelLayout` from `lg:` up). On
// smaller screens `PanelLayout` renders `SidebarNav` inside a `Drawer`
// instead of this wrapper.
export function Sidebar({
  header,
  footer,
  className,
  collapsed = false,
  onCollapsedChange,
  ...navProps
}: SidebarProps) {
  return (
    <motion.aside
      animate={{ width: collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH }}
      transition={{ duration: duration.normal, ease: easing.standard }}
      className={cn(
        "flex h-full shrink-0 flex-col gap-6 overflow-hidden border-r border-border bg-background p-4",
        className,
      )}
    >
      {header ? <div className={cn("px-1", collapsed && "flex justify-center px-0")}>{header}</div> : null}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <SidebarNav {...navProps} collapsed={collapsed} />
      </div>
      {footer ? <div className="px-1">{footer}</div> : null}
      {onCollapsedChange ? (
        <button
          type="button"
          onClick={() => onCollapsedChange(!collapsed)}
          className={cn(
            "flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors duration-fast hover:bg-accent hover:text-accent-foreground",
            collapsed && "justify-center px-2",
          )}
          aria-label={collapsed ? "Kenar çubuğunu genişlet" : "Kenar çubuğunu daralt"}
        >
          {collapsed ? (
            <ChevronsRight className="h-4 w-4 shrink-0" aria-hidden="true" />
          ) : (
            <>
              <ChevronsLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Daralt</span>
            </>
          )}
        </button>
      ) : null}
    </motion.aside>
  );
}
