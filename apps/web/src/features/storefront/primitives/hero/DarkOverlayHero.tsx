import Image from "next/image";

import { OpenStatusBadge } from "./OpenStatusBadge";
import type { StorefrontHeroProps } from "./types";

import { mediaFileUrl } from "@/services/media.service";

// Sprint 8 redesign - "Immersive Restaurant" (Fine Dining's default). Taller
// than Full Bleed Cover, centered editorial composition, a heavier vignette
// (both edges, not just the bottom) for the "sofistike, restrained" fine-
// dining brief - real photography reading as the whole scene, not a banner.
export function DarkOverlayHero({ tenant, theme, layout, sections }: StorefrontHeroProps) {
  const showCover = sections.cover && tenant.coverImageId && layout.coverHeight !== "none";

  return (
    <div className="relative flex h-[74dvh] min-h-[480px] w-full flex-col items-center justify-center overflow-hidden">
      {showCover ? (
        <Image
          src={mediaFileUrl(tenant.coverImageId as string)}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      ) : (
        <div className="absolute inset-0" style={{ backgroundColor: theme.text }} />
      )}
      {/* Full vignette (top+bottom+center darken) rather than a flat scrim -
          reads as considered lighting, not a UI trick slapped over a photo. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 30%, rgba(0,0,0,0.25) 65%, rgba(0,0,0,0.7) 100%)",
        }}
      />

      <div className="relative flex flex-col items-center gap-4 px-6 text-center">
        {sections.logo && tenant.logoImageId ? (
          <Image
            src={mediaFileUrl(tenant.logoImageId)}
            alt={tenant.name}
            width={56}
            height={56}
            className="rounded-full object-cover ring-1 ring-white/40"
          />
        ) : null}
        <div className="flex flex-col gap-2">
          <h1 className="font-[family-name:var(--sf-font-heading)] text-[2.25rem] font-semibold leading-[1.1] tracking-tight text-white [text-wrap:balance]">
            {tenant.name}
          </h1>
          {tenant.tagline ? (
            <p className="font-[family-name:var(--sf-font-body)] text-sm italic tracking-wide text-white/75">{tenant.tagline}</p>
          ) : null}
        </div>
        <div className="h-px w-10 bg-white/30" aria-hidden="true" />
        {sections.workingHours ? <OpenStatusBadge workingHours={tenant.workingHours} tone="on-photo" /> : null}
      </div>
    </div>
  );
}
