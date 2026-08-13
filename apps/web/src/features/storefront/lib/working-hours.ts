// Single source of truth for the weekly working-hours shape - previously
// duplicated (Turkish day labels + defaults) across StorefrontPreview.tsx
// and BusinessProfileForm.tsx. Sprint 7 adds `isOpenNow()` (spec §7's
// "Açık/Kapalı durumu") and the WorkingHoursEditor's "copy to other days"
// (spec §14) on top of this shared shape.

export interface DayHours {
  closed?: boolean;
  open?: string;
  close?: string;
}

export type WorkingHours = Record<string, DayHours>;

export const DAY_ORDER: Array<{ key: string; label: string; shortLabel: string }> = [
  { key: "monday", label: "Pazartesi", shortLabel: "Pzt" },
  { key: "tuesday", label: "Salı", shortLabel: "Sal" },
  { key: "wednesday", label: "Çarşamba", shortLabel: "Çar" },
  { key: "thursday", label: "Perşembe", shortLabel: "Per" },
  { key: "friday", label: "Cuma", shortLabel: "Cum" },
  { key: "saturday", label: "Cumartesi", shortLabel: "Cmt" },
  { key: "sunday", label: "Pazar", shortLabel: "Paz" },
];

const JS_DAY_INDEX_TO_KEY = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

export function getDayHours(workingHours: WorkingHours | null | undefined, dayKey: string): DayHours {
  const entry = workingHours?.[dayKey] ?? {};
  return {
    closed: entry.closed ?? false,
    open: entry.open ?? "09:00",
    close: entry.close ?? "22:00",
  };
}

export function formatDayHours(entry: DayHours): string {
  if (entry.closed) {
    return "Kapalı";
  }
  return `${entry.open ?? "09:00"} - ${entry.close ?? "22:00"}`;
}

// Computed at render time from the current local time - never stored. Used
// by hero primitives for the "Açık/Kapalı" badge (spec §7).
export function isOpenNow(workingHours: WorkingHours | null | undefined, now: Date = new Date()): boolean {
  const todayKey = JS_DAY_INDEX_TO_KEY[now.getDay()];
  const today = getDayHours(workingHours, todayKey ?? "monday");

  if (today.closed) {
    return false;
  }

  const [openH = 9, openM = 0] = (today.open ?? "09:00").split(":").map(Number);
  const [closeH = 22, closeM = 0] = (today.close ?? "22:00").split(":").map(Number);
  const minutesNow = now.getHours() * 60 + now.getMinutes();
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  return minutesNow >= openMinutes && minutesNow < closeMinutes;
}
