import { Loader2 } from "lucide-react";

import { cn } from "../lib/cn";

export interface LoadingProps {
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<LoadingProps["size"]>, string> = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
};

export function Loading({ label, size = "md", className }: LoadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 text-muted-foreground",
        className,
      )}
      role="status"
    >
      <Loader2 className={cn("animate-spin", SIZE_CLASSES[size])} aria-hidden="true" />
      {label ? (
        <span className="text-sm">{label}</span>
      ) : (
        <span className="sr-only">Yükleniyor</span>
      )}
    </div>
  );
}
