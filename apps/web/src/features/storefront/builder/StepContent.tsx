"use client";

import type { StorefrontConfig, TemplateCode } from "@qr-platform/shared";
import { Button } from "@qr-platform/ui";
import Link from "next/link";

import { LayoutEditor } from "../components/LayoutEditor";
import { QrCodePanel } from "../components/QrCodePanel";
import { SectionTogglesForm } from "../components/SectionTogglesForm";
import { SeoSettingsForm } from "../components/SeoSettingsForm";
import { TemplatePicker } from "../components/TemplatePicker";
import { ThemeEditor } from "../components/ThemeEditor";

export type DraftPatch = Partial<Omit<StorefrontConfig, "theme" | "layout" | "sections" | "qr" | "seo">> & {
  theme?: Partial<StorefrontConfig["theme"]>;
  layout?: Partial<StorefrontConfig["layout"]>;
  sections?: Partial<StorefrontConfig["sections"]>;
  qr?: Partial<StorefrontConfig["qr"]>;
  seo?: Partial<StorefrontConfig["seo"]>;
};

export interface StepContentProps {
  stepId: string;
  templateCode: TemplateCode;
  draft: StorefrontConfig;
  onApplyTemplate: (code: TemplateCode, config: StorefrontConfig) => void;
  onPatch: (patch: DraftPatch) => void;
}

// No-code, one-editor-per-step - every step shows only what it needs (spec
// §5 "İşletmeci her şeyi aynı ekranda anlamaya çalışmasın"). QR Kod/SEO
// aren't their own top-level steps in the spec's 7-step list, so they live
// as the last stop before publishing (step 7) instead of a competing step.
export function StepContent({ stepId, templateCode, draft, onApplyTemplate, onPatch }: StepContentProps) {
  switch (stepId) {
    case "template":
      return <TemplatePicker templateCode={templateCode} onSelect={onApplyTemplate} />;

    case "brand":
      return (
        <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">
            Logo, kapak, slogan, hakkında, iletişim bilgileri ve çalışma saatleri İşletme Profili sayfasından
            yönetilir - storefront bunları oradan otomatik okur.
          </p>
          <Button asChild variant="outline" className="w-fit">
            <Link href="/business/profile">İşletme Profilini Düzenle</Link>
          </Button>
        </div>
      );

    case "color":
      return <ThemeEditor theme={draft.theme} onChange={(themePatch) => onPatch({ theme: themePatch })} />;

    case "sections":
      return <SectionTogglesForm sections={draft.sections} onChange={(sectionsPatch) => onPatch({ sections: sectionsPatch })} />;

    case "layout":
      return <LayoutEditor layout={draft.layout} onChange={(layoutPatch) => onPatch({ layout: layoutPatch })} />;

    case "publish":
      return (
        <div className="flex flex-col gap-6">
          <div>
            <p className="mb-2 text-sm font-semibold">QR Kod</p>
            <QrCodePanel qr={draft.qr} onChange={(qrPatch) => onPatch({ qr: qrPatch })} />
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold">SEO ve Diğer</p>
            <SeoSettingsForm
              seo={draft.seo}
              footerText={draft.footerText}
              faviconMediaId={draft.faviconMediaId}
              ogImageMediaId={draft.ogImageMediaId}
              onChange={(patch) => onPatch(patch)}
            />
          </div>
        </div>
      );

    default:
      return null;
  }
}
