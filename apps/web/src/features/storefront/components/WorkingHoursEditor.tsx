"use client";

import { Copy } from "lucide-react";

import { DAY_ORDER, getDayHours } from "../lib/working-hours";
import type { DayHours, WorkingHours } from "../lib/working-hours";

export interface WorkingHoursEditorProps {
  value: WorkingHours;
  onChange: (value: WorkingHours) => void;
}

// Spec §14's real weekly editor: open/close time per day, "tüm gün kapalı",
// and copy-one-day-to-the-rest (the one capability the old BusinessProfileForm
// hours block didn't have). Shared by /business/profile and the builder's
// Brand Info step - see Sprint 7 plan's "reuse, not duplication" decision.
export function WorkingHoursEditor({ value, onChange }: WorkingHoursEditorProps) {
  function updateDay(dayKey: string, patch: Partial<DayHours>): void {
    onChange({ ...value, [dayKey]: { ...getDayHours(value, dayKey), ...patch } });
  }

  function copyToAllDays(sourceDayKey: string): void {
    const source = getDayHours(value, sourceDayKey);
    const next: WorkingHours = {};
    for (const day of DAY_ORDER) {
      next[day.key] = { ...source };
    }
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-3 sm:gap-2">
      {DAY_ORDER.map((day) => {
        const entry = getDayHours(value, day.key);
        return (
          // Single-row 5-column grid (day/checkbox/open/close/copy) never
          // fits a 320-375px phone - two native <input type="time"> controls
          // alone need ~120px+ each. Stacks into two rows below sm instead
          // (confirmed real 320px overflow, not a hypothetical narrow case).
          <div
            key={day.key}
            className="flex flex-col gap-2 rounded-md border border-border p-2 sm:grid sm:grid-cols-[minmax(0,88px)_auto_1fr_1fr_auto] sm:items-center sm:gap-2 sm:border-0 sm:p-0"
          >
            <div className="flex items-center justify-between gap-2 sm:contents">
              <span className="text-sm font-medium text-foreground">{day.label}</span>
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={entry.closed ?? false}
                  onChange={(event) => updateDay(day.key, { closed: event.target.checked })}
                />
                Kapalı
              </label>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:contents">
              <input
                type="time"
                disabled={entry.closed}
                value={entry.open ?? "09:00"}
                onChange={(event) => updateDay(day.key, { open: event.target.value })}
                className="h-9 min-w-0 flex-1 rounded-md border border-border bg-background px-2 text-sm disabled:opacity-50 sm:flex-none"
              />
              <input
                type="time"
                disabled={entry.closed}
                value={entry.close ?? "22:00"}
                onChange={(event) => updateDay(day.key, { close: event.target.value })}
                className="h-9 min-w-0 flex-1 rounded-md border border-border bg-background px-2 text-sm disabled:opacity-50 sm:flex-none"
              />
              <button
                type="button"
                onClick={() => copyToAllDays(day.key)}
                title={`${day.label} saatlerini tüm haftaya uygula`}
                aria-label={`${day.label} saatlerini tüm haftaya uygula`}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <Copy className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
