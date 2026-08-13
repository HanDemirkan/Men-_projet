import Image from "next/image";

import { mediaFileUrl } from "@/services/media.service";

export interface CategoryBandProps {
  name: string;
  description: string | null;
  imageId: string | null;
  productCount: number;
  // Reuses the template's own coverHeight knob rather than a new field -
  // Minimal Coffee already sets this to "none" for its hero (low visual
  // noise brief), so the same signal naturally keeps its category sections
  // to a plain heading instead of a photo band, with no extra config axis.
  showBand: boolean;
}

// Each category gets its own short "chapter opener" when the template calls
// for photo emphasis - Sprint 8 redesign: scrolling used to jump straight
// from one flat text heading to the next with nothing to anchor the eye,
// which read as a settings list, not a restaurant's own menu.
export function CategoryBand({ name, description, imageId, productCount, showBand }: CategoryBandProps) {
  if (!showBand) {
    return (
      <div className="flex flex-col gap-1">
        <h2 className="font-[family-name:var(--sf-font-heading)] text-xl font-semibold" style={{ color: "var(--sf-text)" }}>
          {name}
        </h2>
        {description ? (
          <p className="font-[family-name:var(--sf-font-body)] text-sm" style={{ color: "var(--sf-muted-text)" }}>
            {description}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="relative -mx-3 h-40 overflow-hidden sm:h-48">
      {imageId ? (
        <Image src={mediaFileUrl(imageId)} alt="" fill sizes="100vw" className="object-cover" />
      ) : (
        <div className="absolute inset-0" style={{ backgroundColor: "var(--sf-surface)" }} />
      )}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.7) 100%)" }}
      />
      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 px-4 pb-4">
        <h2 className="font-[family-name:var(--sf-font-heading)] text-2xl font-bold text-white [text-wrap:balance]">{name}</h2>
        {description ? <p className="line-clamp-2 font-[family-name:var(--sf-font-body)] text-sm text-white/85">{description}</p> : null}
        <span className="font-[family-name:var(--sf-font-body)] text-xs text-white/65">{productCount} ürün</span>
      </div>
    </div>
  );
}
