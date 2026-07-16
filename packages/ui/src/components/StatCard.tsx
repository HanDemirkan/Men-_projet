import type { LucideIcon } from "lucide-react";
import type { HTMLAttributes } from "react";

import { cn } from "../lib/cn";

import { Card } from "./Card";

export interface StatCardProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string;
  icon?: LucideIcon;
  trend?: {
    value: string;
    direction: "up" | "down" | "neutral";
  };
}

const TREND_CLASSES: Record<NonNullable<StatCardProps["trend"]>["direction"], string> = {
  up: "text-success",
  down: "text-destructive",
  neutral: "text-muted-foreground",
};

export function StatCard({ label, value, icon: Icon, trend, className, ...props }: StatCardProps) {
  return (
    <Card className={cn("flex flex-col gap-3 p-6", className)} {...props}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        {Icon ? <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" /> : null}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold tracking-tight text-foreground">{value}</span>
        {trend ? (
          <span className={cn("text-xs font-medium", TREND_CLASSES[trend.direction])}>{trend.value}</span>
        ) : null}
      </div>
    </Card>
  );
}
