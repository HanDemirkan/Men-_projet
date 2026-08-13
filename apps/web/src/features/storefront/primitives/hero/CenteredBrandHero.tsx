import Image from "next/image";

import { OpenStatusBadge } from "./OpenStatusBadge";
import type { StorefrontHeroProps } from "./types";

import { mediaFileUrl } from "@/services/media.service";

const HEIGHT_CLASS: Record<string, string> = { none: "h-0", sm: "h-24", md: "h-32", lg: "h-40", xl: "h-52" };

// Spec §7 "Centered Brand" - an elegant, symmetric presentation
// (premium-restaurant's default): small cover as a soft backdrop, logo+name
// centered on top of it, not overlapping a hard edge.
export function CenteredBrandHero({ tenant, layout, sections }: StorefrontHeroProps) {
  const showCover = sections.cover && tenant.coverImageId && layout.coverHeight !== "none";

  return (
    <div className="relative flex flex-col items-center gap-2 px-5 pb-6 pt-8 text-center">
      {showCover ? (
        <div className={`absolute inset-x-0 top-0 ${HEIGHT_CLASS[layout.coverHeight]} opacity-25`}>
          <Image src={mediaFileUrl(tenant.coverImageId as string)} alt="" fill sizes="512px" className="object-cover" />
        </div>
      ) : null}

      <div className="relative flex flex-col items-center gap-2">
        {sections.logo && tenant.logoImageId ? (
          <Image
            src={mediaFileUrl(tenant.logoImageId)}
            alt={tenant.name}
            width={72}
            height={72}
            className="object-cover ring-4 ring-[color:var(--sf-background)]"
            style={{ borderRadius: "var(--sf-radius)" }}
          />
        ) : null}
        <h1 className="font-[family-name:var(--sf-font-heading)] text-2xl font-bold" style={{ color: "var(--sf-text)" }}>
          {tenant.name}
        </h1>
        {tenant.tagline ? (
          <p className="font-[family-name:var(--sf-font-body)] text-sm" style={{ color: "var(--sf-muted-text)" }}>
            {tenant.tagline}
          </p>
        ) : null}
        {sections.workingHours ? <OpenStatusBadge workingHours={tenant.workingHours} /> : null}
      </div>
    </div>
  );
}
