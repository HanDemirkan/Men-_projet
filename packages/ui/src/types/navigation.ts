import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

// Lets `packages/ui` stay framework-agnostic: apps/web passes `next/link`'s
// `Link` here so sidebar/breadcrumb/menu navigation gets real client-side
// routing instead of full page reloads via a plain `<a>`.
export type LinkComponent = (props: {
  href: string;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}) => JSX.Element;
