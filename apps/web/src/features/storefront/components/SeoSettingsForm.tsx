"use client";

import type { StorefrontSeo } from "@qr-platform/shared";
import { Dropzone, Input, Label, Textarea, toast } from "@qr-platform/ui";
import { useState } from "react";

import { mediaFileUrl, uploadMedia } from "@/services/media.service";

export interface SeoSettingsFormProps {
  seo: StorefrontSeo;
  footerText: string | null;
  faviconMediaId: string | null;
  ogImageMediaId: string | null;
  onChange: (patch: {
    seo?: Partial<StorefrontSeo>;
    footerText?: string | null;
    faviconMediaId?: string | null;
    ogImageMediaId?: string | null;
  }) => void;
}

export function SeoSettingsForm({ seo, footerText, faviconMediaId, ogImageMediaId, onChange }: SeoSettingsFormProps) {
  const [isUploadingFavicon, setIsUploadingFavicon] = useState(false);
  const [isUploadingOg, setIsUploadingOg] = useState(false);

  const handleFaviconSelected = async (file: File): Promise<void> => {
    setIsUploadingFavicon(true);
    const result = await uploadMedia(file, "IMAGE");
    setIsUploadingFavicon(false);

    if (result.status === "error") {
      toast({ title: "Favicon yüklenemedi", description: result.message, variant: "destructive" });
      return;
    }

    onChange({ faviconMediaId: result.data.id });
  };

  const handleOgImageSelected = async (file: File): Promise<void> => {
    setIsUploadingOg(true);
    const result = await uploadMedia(file, "IMAGE");
    setIsUploadingOg(false);

    if (result.status === "error") {
      toast({ title: "OpenGraph görseli yüklenemedi", description: result.message, variant: "destructive" });
      return;
    }

    onChange({ ogImageMediaId: result.data.id });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="sf-seo-title">SEO Başlığı</Label>
        <Input
          id="sf-seo-title"
          value={seo.title ?? ""}
          onChange={(event) => onChange({ seo: { title: event.target.value || null } })}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="sf-seo-description">SEO Açıklaması</Label>
        <Textarea
          id="sf-seo-description"
          rows={3}
          value={seo.description ?? ""}
          onChange={(event) => onChange({ seo: { description: event.target.value || null } })}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="sf-footer-text">Footer Metni</Label>
        <Textarea
          id="sf-footer-text"
          rows={2}
          value={footerText ?? ""}
          onChange={(event) => onChange({ footerText: event.target.value || null })}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label>Favicon</Label>
          <Dropzone
            onFileSelected={(file) => void handleFaviconSelected(file)}
            isUploading={isUploadingFavicon}
            previewUrl={faviconMediaId ? mediaFileUrl(faviconMediaId) : null}
            label="Favicon yükle"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label>OpenGraph Görseli</Label>
          <Dropzone
            onFileSelected={(file) => void handleOgImageSelected(file)}
            isUploading={isUploadingOg}
            previewUrl={ogImageMediaId ? mediaFileUrl(ogImageMediaId) : null}
            label="OpenGraph görseli yükle"
          />
        </div>
      </div>
    </div>
  );
}
