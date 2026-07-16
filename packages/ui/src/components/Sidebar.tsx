import type { ReactNode } from "react";

import { cn } from "../lib/cn";
import type { LinkComponent, NavSection } from "../types/navigation";

import { Badge } from "./Badge";

export interface SidebarNavProps {
  sections: NavSection[];
  activePath: string;
  linkComponent?: LinkComponent;
  onNavigate?: () => void;
  className?: string;
}

function isActive(itemHref: string, activePath: string): boolean {
  return activePath === itemHref || activePath.startsWith(`${itemHref}/`);
}

// The nav list itself, decoupled from the surrounding chrome (width, border,
// fixed positioning) so `PanelLayout` can render the exact same markup both
// in the persistent desktop `Sidebar` and inside the mobile `Drawer` -
// avoiding two hand-maintained copies of the navigation.
export function SidebarNav({ sections, activePath, linkComponent, onNavigate, className }: SidebarNavProps) {
  const Anchor = linkComponent;

  return (
    <nav className={cn("flex flex-col gap-6", className)}>
      {sections.map((section, sectionIndex) => (
        <div key={section.title ?? sectionIndex} className="flex flex-col gap-1">
          {section.title ? (
            <p className="px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {section.title}
            </p>
          ) : null}
          {section.items.map((item) => {
            const active = isActive(item.href, activePath);
            const Icon = item.icon;
            const content = (
              <span
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge ? (
                  <Badge variant={active ? "default" : "secondary"} className="px-1.5 py-0 text-[10px]">
                    {item.badge}
                  </Badge>
                ) : null}
              </span>
            );

            return Anchor ? (
              <Anchor key={item.href} href={item.href} onClick={onNavigate} aria-current={active ? "page" : undefined}>
                {content}
              </Anchor>
            ) : (
              <a key={item.href} href={item.href} onClick={onNavigate} aria-current={active ? "page" : undefined}>
                {content}
              </a>
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
}

// Persistent desktop sidebar (rendered by `PanelLayout` from `lg:` up). On
// smaller screens `PanelLayout` renders `SidebarNav` inside a `Drawer`
// instead of this wrapper.
export function Sidebar({ header, footer, className, ...navProps }: SidebarProps) {
  return (
    <aside
      className={cn(
        "flex h-full w-64 shrink-0 flex-col gap-6 border-r border-border bg-background p-4",
        className,
      )}
    >
      {header ? <div className="px-1">{header}</div> : null}
      <div className="flex-1 overflow-y-auto">
        <SidebarNav {...navProps} />
      </div>
      {footer ? <div className="px-1">{footer}</div> : null}
    </aside>
  );
}
