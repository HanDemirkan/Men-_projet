import { DAY_ORDER, formatDayHours, getDayHours } from "../../lib/working-hours";
import type { WorkingHours } from "../../lib/working-hours";

import type { InfoBlockProps } from "./types";

export function isWorkingHoursBlockEnabled({ sections }: InfoBlockProps): boolean {
  return sections.workingHours;
}

// Sprint 8 redesign: dropped the bordered "table" card - a plain heading and
// a loose list read as part of the page, not a settings-panel widget copied
// onto the storefront. Today's row is weighted, not just listed - the one
// piece of information most people actually came here for.
export function WorkingHoursBlock({ tenant }: InfoBlockProps) {
  const workingHours = tenant.workingHours as WorkingHours | null;
  const todayIndex = (new Date().getDay() + 6) % 7; // Monday-first, matching DAY_ORDER

  return (
    <div className="flex flex-col gap-1">
      <p className="font-[family-name:var(--sf-font-heading)] text-sm font-semibold" style={{ color: "var(--sf-text)" }}>
        Çalışma Saatleri
      </p>
      <ul className="flex flex-col">
        {DAY_ORDER.map((day, index) => {
          const entry = getDayHours(workingHours, day.key);
          const isToday = index === todayIndex;
          return (
            <li
              key={day.key}
              className="flex justify-between py-1.5 font-[family-name:var(--sf-font-body)] text-sm"
              style={{ color: isToday ? "var(--sf-text)" : "var(--sf-muted-text)", fontWeight: isToday ? 600 : 400 }}
            >
              <span>{day.label}</span>
              <span>{formatDayHours(entry)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
