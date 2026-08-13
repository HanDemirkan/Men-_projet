"use client";

import type { StorefrontConfig, TemplateCode } from "@qr-platform/shared";
import { COLOR_PALETTES, TEMPLATE_DEFAULTS, buildDefaultStorefrontConfig } from "@qr-platform/shared";
import { Badge, cn } from "@qr-platform/ui";

export interface TemplatePickerProps {
  templateCode: TemplateCode;
  onSelect: (templateCode: TemplateCode, config: StorefrontConfig) => void;
}

// Spec §2: template cards show name/use-case/description + real palette
// swatches, and applying one resets theme+layout to that template's
// defaults while preserving sections/qr/seo (a template switch shouldn't
// silently wipe SEO text or section toggles the business already set).
export function TemplatePicker({ templateCode, onSelect }: TemplatePickerProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {Object.values(TEMPLATE_DEFAULTS).map((def) => {
        const palette = COLOR_PALETTES[def.paletteCode];
        const active = templateCode === def.code;
        return (
          <button
            key={def.code}
            type="button"
            onClick={() => onSelect(def.code, buildDefaultStorefrontConfig(def.code))}
            className={cn(
              "flex flex-col gap-2 rounded-lg border p-3.5 text-left transition-colors hover:border-primary",
              active ? "border-primary ring-1 ring-primary" : "border-border",
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                <span className="h-6 w-6 rounded-full" style={{ backgroundColor: palette.primaryColor }} />
                <span className="h-6 w-6 rounded-full" style={{ backgroundColor: palette.secondaryColor }} />
                <span className="h-6 w-6 rounded-full" style={{ backgroundColor: palette.accentColor }} />
              </div>
              {active ? <Badge variant="success">Seçili</Badge> : null}
            </div>
            <span className="text-sm font-semibold">{def.name}</span>
            <span className="text-xs text-muted-foreground">{def.useCase}</span>
            <span className="text-xs text-muted-foreground">{def.description}</span>
          </button>
        );
      })}
    </div>
  );
}
