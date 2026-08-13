import Image from "next/image";

import { OpenStatusBadge } from "./OpenStatusBadge";
import type { StorefrontHeroProps } from "./types";

import { mediaFileUrl } from "@/services/media.service";

const HEIGHT_CLASS: Record<string, string> = { none: "h-0", sm: "h-32", md: "h-44", lg: "h-56", xl: "h-72" };

// Spec §7 "Split Hero" - cover and brand info side by side on desktop
// (modern-cafe's default), stacked on mobile since there's no room to split.
export function SplitHero({ tenant, layout, sections }: StorefrontHeroProps) {
  const showCover = sections.cover && tenant.coverImageId && layout.coverHeight !== "none";

  return (
    <div className="flex flex-col sm:flex-row">
      {showCover ? (
        <div className={`relative w-full ${HEIGHT_CLASS[layout.coverHeight]} sm:h-40 sm:w-2/5`}>
          <Image
            src={mediaFileUrl(tenant.coverImageId as string)}
            alt=""
            fill
            priority
            sizes="(max-width: 512px) 100vw, 205px"
            className="object-cover"
            style={{ borderRadius: "0 0 var(--sf-radius) 0" }}
          />
        </div>
      ) : null}

      <div className="flex flex-1 items-center gap-3 px-5 py-4">
        {sections.logo && tenant.logoImageId ? (
          <Image
            src={mediaFileUrl(tenant.logoImageId)}
            alt={tenant.name}
            width={56}
            height={56}
            className="shrink-0 object-cover"
            style={{ borderRadius: "var(--sf-radius)" }}
          />
        ) : null}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="font-[family-name:var(--sf-font-heading)] text-xl font-bold" style={{ color: "var(--sf-text)" }}>
              {tenant.name}
            </h1>
            {sections.workingHours ? <OpenStatusBadge workingHours={tenant.workingHours} /> : null}
          </div>
          {tenant.tagline ? (
            <p className="font-[family-name:var(--sf-font-body)] text-sm" style={{ color: "var(--sf-muted-text)" }}>
              {tenant.tagline}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
