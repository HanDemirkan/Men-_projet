import Image from "next/image";

import { OpenStatusBadge } from "./OpenStatusBadge";
import type { StorefrontHeroProps } from "./types";

import { mediaFileUrl } from "@/services/media.service";

// Sprint 8 redesign (Design Review FAIL → rebuild): the old version was a
// ~180px strip with a small corner logo - genuinely indistinguishable from a
// settings-panel preview, per the review's own complaint. "Full Bleed Cover"
// is now a real hero: a near-full-viewport photograph with an editorial
// bottom scrim, brand identity anchored bottom-left where a real restaurant
// app puts it (Modern Cafe's default - see TEMPLATE_DEFAULTS).
export function FullCoverHero({ tenant, theme, layout, sections }: StorefrontHeroProps) {
  const showCover = sections.cover && tenant.coverImageId && layout.coverHeight !== "none";

  return (
    <div className="relative flex h-[62dvh] min-h-[420px] w-full flex-col justify-end overflow-hidden">
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
        // Quality no-photo fallback (Sprint 8 §9 requirement) - a rich
        // gradient in the tenant's own brand colors, not a grey placeholder.
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(150deg, ${theme.primaryColor} 0%, ${theme.secondaryColor} 100%)` }}
        />
      )}
      {/* Bottom-weighted scrim: readable white text over any photo, without
          flattening the image the way a uniform dark overlay would. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 35%, rgba(0,0,0,0.75) 100%)" }}
      />

      <div className="relative flex flex-col gap-3 px-5 pb-7 pt-4">
        <div className="flex items-end gap-3">
          {sections.logo && tenant.logoImageId ? (
            <Image
              src={mediaFileUrl(tenant.logoImageId)}
              alt={tenant.name}
              width={64}
              height={64}
              className="shrink-0 rounded-full object-cover ring-2 ring-white/70"
            />
          ) : null}
          <div className="flex flex-col gap-1.5">
            {sections.workingHours ? <OpenStatusBadge workingHours={tenant.workingHours} tone="on-photo" /> : null}
            <h1 className="font-[family-name:var(--sf-font-heading)] text-[2rem] font-bold leading-[1.05] text-white [text-wrap:balance]">
              {tenant.name}
            </h1>
          </div>
        </div>
        {tenant.tagline ? (
          <p className="font-[family-name:var(--sf-font-body)] text-[15px] leading-snug text-white/85">{tenant.tagline}</p>
        ) : null}
      </div>
    </div>
  );
}
