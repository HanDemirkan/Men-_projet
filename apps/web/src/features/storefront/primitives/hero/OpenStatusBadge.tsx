import { isOpenNow } from "../../lib/working-hours";
import type { WorkingHours } from "../../lib/working-hours";

export interface OpenStatusBadgeProps {
  // `BusinessProfile.workingHours` is typed as a loose `Record<string,
  // unknown>` at the API-response boundary - narrowed to the real shape here.
  workingHours: Record<string, unknown> | null | undefined;
  className?: string;
  // "on-photo": frosted glass (blurred white/10 + white border/text) for
  // heroes sitting on top of a dark photo - the default tinted-surface
  // treatment reads as a nearly invisible smudge over a photograph, since it
  // was designed for a flat, light --sf-surface background.
  tone?: "default" | "on-photo";
}

// Spec §7's "Açık/Kapalı durumu" - computed at render time, never stored.
export function OpenStatusBadge({ workingHours, className, tone = "default" }: OpenStatusBadgeProps) {
  const open = isOpenNow(workingHours as WorkingHours | null | undefined);

  if (tone === "on-photo") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur-md ${className ?? ""}`}
      >
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: open ? "#4ADE80" : "#F87171" }}
          aria-hidden="true"
        />
        {open ? "Şu an açık" : "Şu an kapalı"}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${className ?? ""}`}
      style={{
        // The tint background uses the same brand green/red as everywhere
        // else, but the TEXT is a deliberately darker shade than the badge
        // border/dot color - #16A34A/#DC2626 text on their own 15% tint
        // only reaches ~2.7:1/3.8:1 contrast, both below WCAG AA's 4.5:1
        // minimum for normal text (real axe-core failure, not a false
        // positive - and one whose pass/fail depended on real wall-clock
        // time, since which color renders follows isOpenNow()).
        backgroundColor: open ? "color-mix(in srgb, #16A34A 15%, transparent)" : "color-mix(in srgb, #DC2626 15%, transparent)",
        color: open ? "#166534" : "#B91C1C",
      }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "currentColor" }} aria-hidden="true" />
      {open ? "Açık" : "Kapalı"}
    </span>
  );
}
