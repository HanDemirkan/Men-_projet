"use client";

import type { StorefrontLayout } from "@qr-platform/shared";
import { Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@qr-platform/ui";

import { CATEGORY_NAV_REGISTRY } from "../primitives/category-nav";
import { FOOTER_REGISTRY } from "../primitives/footer";
import { HERO_REGISTRY } from "../primitives/hero";
import { PRODUCT_CARD_REGISTRY } from "../primitives/product-card";
import { registryOptions } from "../registry/plugin-types";

export interface LayoutEditorProps {
  layout: StorefrontLayout;
  onChange: (patch: Partial<StorefrontLayout>) => void;
}

function optionsFor<T extends string>(entries: Array<[T, string]>) {
  return entries.map(([value, label]) => ({ value, label }));
}

// Hero/CategoryNav/ProductCard/Footer options come straight from their
// registries (Sprint 7 architecture rule §2/§10) - adding a new one there
// makes it appear here automatically, no parallel label list to keep in
// sync.
const HERO_OPTIONS = registryOptions(HERO_REGISTRY);
const CATEGORY_NAV_OPTIONS = registryOptions(CATEGORY_NAV_REGISTRY);
const PRODUCT_CARD_OPTIONS = registryOptions(PRODUCT_CARD_REGISTRY);
const FOOTER_STYLE_OPTIONS = registryOptions(FOOTER_REGISTRY);

const COVER_HEIGHT_OPTIONS = optionsFor<StorefrontLayout["coverHeight"]>([
  ["none", "Kapak Yok"],
  ["sm", "Kısa"],
  ["md", "Orta"],
  ["lg", "Uzun"],
  ["xl", "Çok Uzun"],
]);

const LOGO_POSITION_OPTIONS = optionsFor<StorefrontLayout["logoPosition"]>([
  ["top-left", "Sol Üst"],
  ["centered", "Ortalı"],
  ["bottom-left", "Sol Alt"],
  ["floating-card", "Yüzen Kart"],
]);

const PHOTO_ASPECT_OPTIONS = optionsFor<StorefrontLayout["photoAspectRatio"]>([
  ["1:1", "Kare (1:1)"],
  ["4:3", "4:3"],
  ["16:9", "Geniş (16:9)"],
  ["3:4", "Dikey (3:4)"],
]);

const RADIUS_OPTIONS = optionsFor<StorefrontLayout["borderRadius"]>([
  ["none", "Köşeli"],
  ["sm", "Az Yuvarlak"],
  ["md", "Orta Yuvarlak"],
  ["lg", "Yuvarlak"],
  ["xl", "Çok Yuvarlak"],
]);

const SHADOW_OPTIONS = optionsFor<StorefrontLayout["shadow"]>([
  ["none", "Gölgesiz"],
  ["soft", "Yumuşak"],
  ["hard", "Sert"],
]);

const BACKGROUND_TEXTURE_OPTIONS = optionsFor<StorefrontLayout["backgroundTexture"]>([
  ["none", "Düz"],
  ["subtle-gradient", "Hafif Geçiş"],
  ["subtle-noise", "Hafif Doku"],
  ["diagonal-pattern", "Çapraz Desen"],
]);

const BUTTON_SHAPE_OPTIONS = optionsFor<StorefrontLayout["buttonShape"]>([
  ["square", "Köşeli"],
  ["rounded", "Yuvarlak"],
  ["pill", "Hap"],
  ["outline", "Çerçeveli"],
]);

interface FieldConfig {
  key: keyof StorefrontLayout;
  label: string;
  options: Array<{ value: string; label: string }>;
}

const FIELDS: FieldConfig[] = [
  { key: "hero", label: "Hero Tipi", options: HERO_OPTIONS },
  { key: "coverHeight", label: "Kapak Yüksekliği", options: COVER_HEIGHT_OPTIONS },
  { key: "logoPosition", label: "Logo Konumu", options: LOGO_POSITION_OPTIONS },
  { key: "categoryNav", label: "Kategori Navigasyonu", options: CATEGORY_NAV_OPTIONS },
  { key: "productCard", label: "Ürün Kartı Stili", options: PRODUCT_CARD_OPTIONS },
  { key: "photoAspectRatio", label: "Fotoğraf Oranı", options: PHOTO_ASPECT_OPTIONS },
  { key: "borderRadius", label: "Köşe Yuvarlaklığı", options: RADIUS_OPTIONS },
  { key: "shadow", label: "Gölge Yoğunluğu", options: SHADOW_OPTIONS },
  { key: "backgroundTexture", label: "Arka Plan Dokusu", options: BACKGROUND_TEXTURE_OPTIONS },
  { key: "buttonShape", label: "Buton Biçimi", options: BUTTON_SHAPE_OPTIONS },
  { key: "footerStyle", label: "Footer Yapısı", options: FOOTER_STYLE_OPTIONS },
];

// Spec §7-9's structural axes, independently overridable regardless of
// which template was chosen (the template only sets the initial defaults).
export function LayoutEditor({ layout, onChange }: LayoutEditorProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {FIELDS.map((field) => (
        <div key={field.key} className="flex flex-col gap-2">
          <Label>{field.label}</Label>
          <Select value={layout[field.key] as string} onValueChange={(value) => onChange({ [field.key]: value } as Partial<StorefrontLayout>)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {field.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ))}
    </div>
  );
}
