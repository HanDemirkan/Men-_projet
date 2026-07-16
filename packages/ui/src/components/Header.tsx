import { Menu } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "../lib/cn";

import { Button } from "./Button";

export interface HeaderProps {
  onMenuClick?: () => void;
  breadcrumb?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function Header({ onMenuClick, breadcrumb, actions, className }: HeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-6",
        className,
      )}
    >
      {onMenuClick ? (
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
          aria-label="Menüyü aç"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </Button>
      ) : null}
      <div className="min-w-0 flex-1">{breadcrumb}</div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}
