"use client";

import type { StorefrontSections } from "@qr-platform/shared";
import { Label, Switch } from "@qr-platform/ui";

export interface SectionTogglesFormProps {
  sections: StorefrontSections;
  onChange: (patch: Partial<StorefrontSections>) => void;
}

const SECTION_LABELS: Array<{ key: keyof StorefrontSections; label: string }> = [
  { key: "cover", label: "Kapak Görseli" },
  { key: "logo", label: "Logo" },
  { key: "about", label: "Hakkında" },
  { key: "workingHours", label: "Çalışma Saatleri" },
  { key: "contact", label: "İletişim Butonları" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "phone", label: "Telefon" },
  { key: "googleMaps", label: "Google Maps" },
  { key: "social", label: "Sosyal Medya" },
  { key: "menus", label: "Aktif Menüler" },
];

// Toggles which QR-experience sections (spec §2) render on the public
// storefront - a display preference, not a permission boundary (all the
// underlying data already came from Business Profile, itself already
// gated by tenant.update - see ADR 0009).
export function SectionTogglesForm({ sections, onChange }: SectionTogglesFormProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {SECTION_LABELS.map(({ key, label }) => (
        <div key={key} className="flex items-center justify-between gap-2 rounded-md border border-border p-3">
          <Label htmlFor={`sf-section-${key}`} className="cursor-pointer font-normal">
            {label}
          </Label>
          <Switch
            id={`sf-section-${key}`}
            checked={sections[key]}
            onCheckedChange={(checked) => onChange({ [key]: checked })}
          />
        </div>
      ))}
    </div>
  );
}
