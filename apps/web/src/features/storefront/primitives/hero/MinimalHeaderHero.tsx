import Image from "next/image";

import { OpenStatusBadge } from "./OpenStatusBadge";
import type { StorefrontHeroProps } from "./types";

import { mediaFileUrl } from "@/services/media.service";

// Sprint 8 redesign - "Minimal Brand" (Minimal Coffee's default). No cover
// photo by design (typography-led, low visual noise per the brief), but
// "minimal" is a deliberate, precise composition - not empty space left
// over from a hero nobody designed. A thin rule under the name and generous,
// exact vertical rhythm carry the weight a photo would elsewhere.
export function MinimalHeaderHero({ tenant, sections }: StorefrontHeroProps) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 pb-8 pt-14 text-center">
      {sections.logo && tenant.logoImageId ? (
        <Image
          src={mediaFileUrl(tenant.logoImageId)}
          alt={tenant.name}
          width={44}
          height={44}
          className="rounded-full object-cover"
        />
      ) : null}
      <h1
        className="font-[family-name:var(--sf-font-heading)] text-2xl font-semibold uppercase tracking-[0.08em]"
        style={{ color: "var(--sf-text)" }}
      >
        {tenant.name}
      </h1>
      <div className="h-px w-8" style={{ backgroundColor: "var(--sf-border)" }} aria-hidden="true" />
      {tenant.tagline ? (
        <p className="font-[family-name:var(--sf-font-body)] text-sm" style={{ color: "var(--sf-muted-text)" }}>
          {tenant.tagline}
        </p>
      ) : null}
      {sections.workingHours ? <OpenStatusBadge workingHours={tenant.workingHours} className="mt-1" /> : null}
    </div>
  );
}
