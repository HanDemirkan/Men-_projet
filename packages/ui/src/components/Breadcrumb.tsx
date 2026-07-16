import { ChevronRight } from "lucide-react";

import { cn } from "../lib/cn";
import type { LinkComponent } from "../types/navigation";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  linkComponent?: LinkComponent;
  className?: string;
}

export function Breadcrumb({ items, linkComponent: LinkComponent, className }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center text-sm", className)}>
      <ol className="flex items-center gap-1.5">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
              {index > 0 ? <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" /> : null}
              {item.href && !isLast ? (
                LinkComponent ? (
                  <LinkComponent href={item.href}>
                    <span className="text-muted-foreground transition-colors hover:text-foreground">
                      {item.label}
                    </span>
                  </LinkComponent>
                ) : (
                  <a href={item.href} className="text-muted-foreground transition-colors hover:text-foreground">
                    {item.label}
                  </a>
                )
              ) : (
                <span
                  className={cn(isLast ? "font-medium text-foreground" : "text-muted-foreground")}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
