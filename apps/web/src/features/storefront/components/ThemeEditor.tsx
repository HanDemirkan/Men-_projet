"use client";

import type { ColorPaletteCode, StorefrontTheme, StorefrontTypographyPairing, TypeScaleSize } from "@qr-platform/shared";
import { COLOR_PALETTES, TYPOGRAPHY_PAIRINGS, contrastRatio, meetsWcagAA } from "@qr-platform/shared";
import { Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, cn } from "@qr-platform/ui";
import { TriangleAlert } from "lucide-react";

export interface ThemeEditorProps {
  theme: StorefrontTheme;
  onChange: (patch: Partial<StorefrontTheme>) => void;
}

const COLOR_FIELDS: Array<{ key: keyof StorefrontTheme & string; label: string }> = [
  { key: "primaryColor", label: "Ana Renk" },
  { key: "secondaryColor", label: "İkincil Renk" },
  { key: "accentColor", label: "Vurgu Rengi" },
  { key: "background", label: "Arka Plan" },
  { key: "surface", label: "Yüzey (Kart)" },
  { key: "text", label: "Metin" },
  { key: "mutedText", label: "Soluk Metin" },
  { key: "border", label: "Kenarlık" },
];

const SIZE_OPTIONS: Array<{ value: TypeScaleSize; label: string }> = [
  { value: "sm", label: "Küçük" },
  { value: "md", label: "Orta" },
  { value: "lg", label: "Büyük" },
];

const LETTER_SPACING_OPTIONS: Array<{ value: StorefrontTheme["letterSpacing"]; label: string }> = [
  { value: "tight", label: "Sıkı" },
  { value: "normal", label: "Normal" },
  { value: "wide", label: "Geniş" },
];

export function ThemeEditor({ theme, onChange }: ThemeEditorProps) {
  const textRatio = contrastRatio(theme.text, theme.background);
  const mutedRatio = contrastRatio(theme.mutedText, theme.background);
  const contrastOk = meetsWcagAA(textRatio) && meetsWcagAA(mutedRatio);

  function updateColor(key: (typeof COLOR_FIELDS)[number]["key"], value: string): void {
    onChange({ [key]: value, paletteCode: "custom" } as Partial<StorefrontTheme>);
  }

  function applyPalette(code: Exclude<ColorPaletteCode, "custom">): void {
    onChange({ ...COLOR_PALETTES[code], paletteCode: code });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label>Hazır Renk Paletleri</Label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(COLOR_PALETTES) as Array<Exclude<ColorPaletteCode, "custom">>).map((code) => {
            const palette = COLOR_PALETTES[code];
            const active = theme.paletteCode === code;
            return (
              <button
                key={code}
                type="button"
                onClick={() => applyPalette(code)}
                className={cn("flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-medium transition-colors", active ? "border-primary ring-1 ring-primary" : "border-border")}
              >
                <span className="flex gap-0.5">
                  <span className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: palette.primaryColor }} />
                  <span className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: palette.secondaryColor }} />
                  <span className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: palette.accentColor }} />
                </span>
                {PALETTE_LABELS[code]}
              </button>
            );
          })}
        </div>
      </div>

      {!contrastOk ? (
        <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            Metin renkleri arka planla yeterli kontrast sağlamıyor (WCAG AA, 4.5:1 gerekli). Bu haliyle{" "}
            <strong>kaydedilemez</strong> - metin veya arka plan rengini değiştirin.
          </span>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {COLOR_FIELDS.map((field) => (
          <div key={field.key} className="flex flex-col gap-2">
            <Label htmlFor={`sf-${field.key}`}>{field.label}</Label>
            <Input
              id={field.key === "primaryColor" ? "sf-primary-color" : `sf-${field.key}`}
              type="color"
              value={(theme[field.key] as string) ?? "#000000"}
              onChange={(event) => updateColor(field.key, event.target.value)}
              className="h-10 w-full"
            />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label>Yazı Tipi Eşleşmesi</Label>
          <Select value={theme.typographyPairing} onValueChange={(value) => onChange({ typographyPairing: value as StorefrontTypographyPairing })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TYPOGRAPHY_PAIRINGS).map(([value, def]) => (
                <SelectItem key={value} value={value}>
                  {def.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Başlık Boyutu</Label>
          <Select value={theme.headingSize} onValueChange={(value) => onChange({ headingSize: value as TypeScaleSize })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SIZE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Gövde Boyutu</Label>
          <Select value={theme.bodySize} onValueChange={(value) => onChange({ bodySize: value as TypeScaleSize })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SIZE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label>Harf Aralığı</Label>
          <Select value={theme.letterSpacing} onValueChange={(value) => onChange({ letterSpacing: value as StorefrontTheme["letterSpacing"] })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LETTER_SPACING_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

const PALETTE_LABELS: Record<Exclude<ColorPaletteCode, "custom">, string> = {
  "coffee-brown": "Coffee Brown",
  "olive-green": "Olive Green",
  "deep-navy": "Deep Navy",
  burgundy: "Burgundy",
  "warm-beige": "Warm Beige",
  charcoal: "Charcoal",
  "orange-energy": "Orange Energy",
  "pastel-dessert": "Pastel Dessert",
};
