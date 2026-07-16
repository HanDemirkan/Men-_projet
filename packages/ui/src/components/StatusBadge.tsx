import { clsx } from "clsx";

export type StatusBadgeState = "up" | "down" | "pending";

export interface StatusBadgeProps {
  state: StatusBadgeState;
  label: string;
}

const STATE_CLASSES: Record<StatusBadgeState, string> = {
  up: "bg-emerald-100 text-emerald-800",
  down: "bg-red-100 text-red-800",
  pending: "bg-slate-100 text-slate-600",
};

export function StatusBadge({ state, label }: StatusBadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        STATE_CLASSES[state],
      )}
    >
      <span
        className={clsx("h-1.5 w-1.5 rounded-full", {
          "bg-emerald-500": state === "up",
          "bg-red-500": state === "down",
          "bg-slate-400": state === "pending",
        })}
      />
      {label}
    </span>
  );
}
