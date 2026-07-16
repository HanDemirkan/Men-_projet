import { QrCode } from "lucide-react";

import { cn } from "../lib/cn";

export interface LogoProps {
  size?: "sm" | "md" | "lg";
  iconOnly?: boolean;
  className?: string;
}

const MARK_SIZE_CLASSES: Record<NonNullable<LogoProps["size"]>, string> = {
  sm: "h-6 w-6",
  md: "h-8 w-8",
  lg: "h-10 w-10",
};

const TEXT_SIZE_CLASSES: Record<NonNullable<LogoProps["size"]>, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
};

const ICON_SIZE_CLASSES: Record<NonNullable<LogoProps["size"]>, string> = {
  sm: "h-3.5 w-3.5",
  md: "h-4.5 w-4.5",
  lg: "h-5 w-5",
};

export function Logo({ size = "md", iconOnly = false, className }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground",
          MARK_SIZE_CLASSES[size],
        )}
      >
        <QrCode className={ICON_SIZE_CLASSES[size]} aria-hidden="true" />
      </span>
      {iconOnly ? null : (
        <span className={cn("font-semibold tracking-tight text-foreground", TEXT_SIZE_CLASSES[size])}>
          QR Platform
        </span>
      )}
    </div>
  );
}
