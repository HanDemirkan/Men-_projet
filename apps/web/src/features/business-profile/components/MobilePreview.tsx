import { Globe, Instagram, MapPin, Phone } from "lucide-react";

import { mediaFileUrl } from "@/services/media.service";

export interface MobilePreviewValues {
  name: string;
  about?: string;
  phone?: string;
  address?: string;
  instagram?: string;
  website?: string;
}

export interface MobilePreviewProps {
  values: MobilePreviewValues;
  logoImageId: string | null;
  coverImageId: string | null;
}

// A real, live preview of the storefront's own current draft state - watches
// the form's live values via react-hook-form's `watch()`, not a static mock.
export function MobilePreview({ values, logoImageId, coverImageId }: MobilePreviewProps) {
  return (
    <div className="sticky top-6 mx-auto w-full max-w-[280px]">
      <div className="rounded-[2rem] border-4 border-foreground/10 bg-background p-2 shadow-lg">
        <div className="flex h-[520px] flex-col overflow-hidden rounded-[1.5rem] border border-border">
          <div className="relative h-28 shrink-0 bg-muted">
            {coverImageId ? (
              <img src={mediaFileUrl(coverImageId)} alt="" className="h-full w-full object-cover" />
            ) : null}
            <div className="absolute -bottom-6 left-4 h-14 w-14 overflow-hidden rounded-full border-2 border-background bg-muted">
              {logoImageId ? (
                <img src={mediaFileUrl(logoImageId)} alt="" className="h-full w-full object-cover" />
              ) : null}
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 pb-4 pt-9">
            <h4 className="truncate text-sm font-semibold text-foreground">{values.name || "İşletme Adı"}</h4>
            {values.about ? <p className="line-clamp-3 text-xs text-muted-foreground">{values.about}</p> : null}

            <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
              {values.phone ? (
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3 w-3 shrink-0" aria-hidden="true" />
                  {values.phone}
                </span>
              ) : null}
              {values.address ? (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                  <span className="truncate">{values.address}</span>
                </span>
              ) : null}
              {values.instagram ? (
                <span className="flex items-center gap-1.5">
                  <Instagram className="h-3 w-3 shrink-0" aria-hidden="true" />
                  {values.instagram}
                </span>
              ) : null}
              {values.website ? (
                <span className="flex items-center gap-1.5">
                  <Globe className="h-3 w-3 shrink-0" aria-hidden="true" />
                  <span className="truncate">{values.website}</span>
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>
      <p className="mt-2 text-center text-xs text-muted-foreground">Mobil Önizleme</p>
    </div>
  );
}
