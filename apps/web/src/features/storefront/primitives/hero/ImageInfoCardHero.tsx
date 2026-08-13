import Image from "next/image";

import { OpenStatusBadge } from "./OpenStatusBadge";
import type { StorefrontHeroProps } from "./types";

import { mediaFileUrl } from "@/services/media.service";

const HEIGHT_CLASS: Record<string, string> = { none: "h-0", sm: "h-28", md: "h-40", lg: "h-52", xl: "h-64" };

// Spec §7 "Image + Info Card" - cover with a rounded card floating over its
// bottom edge holding logo/name/tagline (bakery's default) - a friendlier,
// less rigid take on the classic full-cover layout.
export function ImageInfoCardHero({ tenant, layout, sections }: StorefrontHeroProps) {
  const showCover = sections.cover && tenant.coverImageId && layout.coverHeight !== "none";

  return (
    <div className="flex flex-col">
      {showCover ? (
        <div className={`relative w-full ${HEIGHT_CLASS[layout.coverHeight]}`}>
          <Image
            src={mediaFileUrl(tenant.coverImageId as string)}
            alt=""
            fill
            priority
            sizes="(max-width: 512px) 100vw, 512px"
            className="object-cover"
          />
        </div>
      ) : null}

      <div className="px-5">
        <div
          className={`flex flex-col items-center gap-1.5 px-4 py-4 text-center shadow-md ${showCover ? "-mt-8" : ""}`}
          style={{ backgroundColor: "var(--sf-surface)", borderRadius: "var(--sf-radius)", border: "1px solid var(--sf-border)" }}
        >
          {sections.logo && tenant.logoImageId ? (
            <Image
              src={mediaFileUrl(tenant.logoImageId)}
              alt={tenant.name}
              width={56}
              height={56}
              // Only pokes up over the photo above when there IS a cover to
              // float over - without one, the card itself already starts at
              // a normal (non-negative-margin) position, so this would just
              // push the logo above the card's own top edge for no reason.
              className={`object-cover ring-4 ring-[color:var(--sf-surface)] ${showCover ? "-mt-10" : ""}`}
              style={{ borderRadius: "var(--sf-radius)" }}
            />
          ) : null}
          <h1 className="font-[family-name:var(--sf-font-heading)] text-xl font-bold" style={{ color: "var(--sf-text)" }}>
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
    </div>
  );
}
