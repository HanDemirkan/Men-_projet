"use client";

import type { StorefrontConfig, TemplateCode } from "@qr-platform/shared";
import { contrastRatio, meetsWcagAA } from "@qr-platform/shared";
import { Badge, Button, Tabs, TabsContent, TabsList, TabsTrigger, toast } from "@qr-platform/ui";
import { useState } from "react";

import { DevicePreview } from "../builder/DevicePreview";
import { StepContent } from "../builder/StepContent";
import type { DraftPatch } from "../builder/StepContent";
import type { BuilderStep } from "../builder/StepIndicator";
import { StepIndicator } from "../builder/StepIndicator";

import { PublicUrlBar } from "./PublicUrlBar";
import { StorefrontRenderer } from "./StorefrontRenderer";

import { publishStorefrontConfig, revertStorefrontConfig, updateStorefrontConfigDraft } from "@/services/storefront-config.service";
import type { PublicTenant, StorefrontMenuSummary } from "@/types/storefront";

export interface StorefrontBuilderProps {
  tenant: PublicTenant;
  menus: StorefrontMenuSummary[];
  initialTemplateCode: TemplateCode;
  initialDraft: StorefrontConfig;
  initialHasUnpublishedChanges: boolean;
  initialPublishedAt: string | null;
}

// Spec §3's exact 7-step flow. "Önizle"/"Yayınla" are real steps at the end
// (matching the spec literally) - the persistent top bar's own Kaydet/
// Yayınla buttons are a shortcut for a business that already knows what it
// wants, not a replacement for the guided walk-through.
const STEPS: BuilderStep[] = [
  { id: "template", label: "Şablon Seç" },
  { id: "brand", label: "Marka Bilgileri" },
  { id: "color", label: "Renk ve Yazı" },
  { id: "sections", label: "Bölümler" },
  { id: "layout", label: "Menü Görünümü" },
  { id: "preview", label: "Önizle" },
  { id: "publish", label: "Yayınla" },
];

function formatPublishedAt(iso: string | null): string {
  if (!iso) {
    return "Henüz yayınlanmadı";
  }
  return new Date(iso).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" });
}

// Draft/publish (ADR 0009): every field change here only ever updates local
// React state - the live preview (StorefrontRenderer, the exact same
// component the real public pages use - Sprint 7 architecture rule §1, no
// separate render tree) reflects it instantly, under 50ms, with zero
// network calls (rule §6). "Kaydet" persists the draft (still not live);
// "Yayınla" is the one action that updates what /{tenantSlug} renders.
export function StorefrontBuilder({
  tenant,
  menus,
  initialTemplateCode,
  initialDraft,
  initialHasUnpublishedChanges,
  initialPublishedAt,
}: StorefrontBuilderProps) {
  const [templateCode, setTemplateCode] = useState<TemplateCode>(initialTemplateCode);
  const [draft, setDraft] = useState<StorefrontConfig>(initialDraft);
  const [hasUnpublishedChanges, setHasUnpublishedChanges] = useState(initialHasUnpublishedChanges);
  const [publishedAt, setPublishedAt] = useState(initialPublishedAt);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isReverting, setIsReverting] = useState(false);

  const [stepIndex, setStepIndex] = useState(0);
  const [furthestVisited, setFurthestVisited] = useState(0);
  const [mobileStepIndex, setMobileStepIndex] = useState(0); // within steps 0-4 only

  const textRatio = contrastRatio(draft.theme.text, draft.theme.background);
  const mutedRatio = contrastRatio(draft.theme.mutedText, draft.theme.background);
  const contrastSafe = meetsWcagAA(textRatio) && meetsWcagAA(mutedRatio);

  function goToStep(index: number): void {
    setStepIndex(index);
    setFurthestVisited((prev) => Math.max(prev, index));
  }

  function patchDraft(patch: DraftPatch): void {
    setDraft((prev) => ({
      ...prev,
      ...patch,
      theme: { ...prev.theme, ...patch.theme },
      layout: { ...prev.layout, ...patch.layout },
      sections: { ...prev.sections, ...patch.sections },
      qr: { ...prev.qr, ...patch.qr },
      seo: { ...prev.seo, ...patch.seo },
    }));
    setHasUnpublishedChanges(true);
  }

  function applyTemplate(nextCode: TemplateCode, nextConfig: StorefrontConfig): void {
    setTemplateCode(nextCode);
    // Template switch resets theme+layout to the new template's defaults but
    // preserves sections/qr/seo/footer/favicon/og - those are business
    // content decisions, not part of the visual template (spec §2/§3's
    // Template=Layout, Theme=görsel ayarlar split).
    setDraft((prev) => ({ ...prev, theme: nextConfig.theme, layout: nextConfig.layout }));
    setHasUnpublishedChanges(true);
  }

  async function handleSave(): Promise<void> {
    if (!contrastSafe) {
      toast({ title: "Kaydedilemedi", description: "Metin kontrastı WCAG AA'yı karşılamıyor.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    const result = await updateStorefrontConfigDraft(templateCode, draft);
    setIsSaving(false);
    if (result.status === "error") {
      toast({ title: "Kaydedilemedi", description: result.message, variant: "destructive" });
      return;
    }
    setDraft(result.data.config);
    toast({ title: "Kaydedildi", description: "Taslak güncellendi. Yayınlamadan storefront değişmez.", variant: "success" });
  }

  async function handlePublish(): Promise<void> {
    setIsPublishing(true);
    const result = await publishStorefrontConfig();
    setIsPublishing(false);
    if (result.status === "error") {
      toast({ title: "Yayınlanamadı", description: result.message, variant: "destructive" });
      return;
    }
    setHasUnpublishedChanges(false);
    setPublishedAt(result.data.publishedAt);
    toast({ title: "Yayınlandı", description: "Public storefront güncellendi.", variant: "success" });
  }

  async function handleRevert(): Promise<void> {
    setIsReverting(true);
    const result = await revertStorefrontConfig();
    setIsReverting(false);
    if (result.status === "error") {
      toast({ title: "Geri alınamadı", description: result.message, variant: "destructive" });
      return;
    }
    setTemplateCode(result.data.templateCode);
    setDraft(result.data.config);
    setPublishedAt(result.data.publishedAt);
    setHasUnpublishedChanges(false);
    toast({ title: "Geri alındı", description: "Bir önceki yayın tekrar yayında.", variant: "success" });
  }

  const statusBar = (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {hasUnpublishedChanges ? <Badge variant="outline">Yayınlanmamış değişiklikler var</Badge> : <Badge variant="success">Yayında</Badge>}
          <span className="text-xs text-muted-foreground">Son yayınlanma: {formatPublishedAt(publishedAt)}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={() => void handleRevert()} isLoading={isReverting}>
            Yayını Geri Al
          </Button>
          <Button variant="outline" onClick={() => void handleSave()} isLoading={isSaving} disabled={!contrastSafe}>
            Kaydet
          </Button>
          <Button onClick={() => void handlePublish()} isLoading={isPublishing}>
            Yayınla
          </Button>
        </div>
      </div>
      <PublicUrlBar tenantSlug={tenant.slug} />
    </div>
  );

  const stepContentProps = { templateCode, draft, onApplyTemplate: applyTemplate, onPatch: patchDraft };

  return (
    <div className="flex flex-col gap-6">
      {statusBar}

      {/* Desktop: full 7-step guided flow, live preview always docked. */}
      <div className="hidden lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-6">
        <div className="flex flex-col gap-4">
          <StepIndicator steps={STEPS} currentIndex={stepIndex} furthestVisitedIndex={furthestVisited} onStepClick={goToStep} />

          <div className="min-h-[320px] rounded-lg">
            {STEPS[stepIndex]?.id === "preview" ? (
              <DevicePreview tenant={tenant} config={draft} menus={menus} />
            ) : (
              <StepContent stepId={STEPS[stepIndex]?.id ?? "template"} {...stepContentProps} />
            )}
          </div>

          <div className="flex justify-between">
            <Button variant="outline" disabled={stepIndex === 0} onClick={() => goToStep(Math.max(0, stepIndex - 1))}>
              Geri
            </Button>
            {stepIndex < STEPS.length - 1 ? (
              <Button onClick={() => goToStep(Math.min(STEPS.length - 1, stepIndex + 1))}>İleri</Button>
            ) : null}
          </div>
        </div>

        <div className="h-fit lg:sticky lg:top-4">
          <p className="mb-2 text-sm font-semibold text-muted-foreground">Canlı Önizleme</p>
          <div className="overflow-hidden rounded-lg border border-border">
            <StorefrontRenderer tenant={tenant} config={draft} mode="home" menus={menus} testId="storefront-preview" />
          </div>
        </div>
      </div>

      {/* Mobile: 3 tabs (spec §3's "Ayarlar / Önizle / Yayınla"). */}
      <div className="lg:hidden">
        <Tabs defaultValue="settings">
          <TabsList>
            <TabsTrigger value="settings">Ayarlar</TabsTrigger>
            <TabsTrigger value="preview">Önizle</TabsTrigger>
            <TabsTrigger value="publish">Yayınla</TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="mt-4 flex flex-col gap-4">
            <StepIndicator
              steps={STEPS.slice(0, 5)}
              currentIndex={mobileStepIndex}
              furthestVisitedIndex={4}
              onStepClick={setMobileStepIndex}
            />
            <StepContent stepId={STEPS[mobileStepIndex]?.id ?? "template"} {...stepContentProps} />
            <div className="flex justify-between">
              <Button variant="outline" disabled={mobileStepIndex === 0} onClick={() => setMobileStepIndex((i) => Math.max(0, i - 1))}>
                Geri
              </Button>
              <Button disabled={mobileStepIndex === 4} onClick={() => setMobileStepIndex((i) => Math.min(4, i + 1))}>
                İleri
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="mt-4">
            <DevicePreview tenant={tenant} config={draft} menus={menus} />
          </TabsContent>

          <TabsContent value="publish" className="mt-4">
            <StepContent stepId="publish" {...stepContentProps} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
