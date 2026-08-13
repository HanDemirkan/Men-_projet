import { HttpStatus, Injectable } from "@nestjs/common";
import { prisma, tenantScopedPrisma } from "@qr-platform/database";
import type { Prisma } from "@qr-platform/database";
import type { StorefrontConfig, TemplateCode } from "@qr-platform/shared";
import {
  DEFAULT_TEMPLATE_CODE,
  TEMPLATE_DEFAULTS,
  buildDefaultStorefrontConfig,
  contrastRatio,
  meetsWcagAA,
  mergeStorefrontConfig,
} from "@qr-platform/shared";

import { AppException } from "../../common/exceptions/app.exception";

import type { UpdateStorefrontConfigDraftDto } from "./dto/update-storefront-config-draft.dto";

// Sprint 7: storefront customization moved off Tenant into its own
// TenantStorefrontConfig table (1:1, tenantId is its @id) plus a
// StorefrontConfigRevision history table - see the Prisma schema and
// docs/decisions/0011-storefront-template-system.md. Both are tenant-scoped
// models (see packages/database's TENANT_SCOPED_MODELS), so every call here
// goes through tenantScopedPrisma - AuthContextMiddleware already wraps
// every authenticated request in runWithTenantContext(req.user.tenantId,
// ...), so the ambient context always matches the tenantId this service
// receives explicitly (kept as an explicit param, not read from context
// directly, only so the controller's ForbiddenException-on-no-tenant guard
// stays a friendly error instead of tenantScopedPrisma's generic one).
//
// Draft/publish is still the deliberate two-stage model from ADR 0009: a
// PATCH to /draft never touches what the public storefront renders; only
// POST /publish does, and it now also snapshots a StorefrontConfigRevision
// row so /revert can restore the previous publish.
@Injectable()
export class StorefrontConfigService {
  async get(tenantId: string) {
    const record = await this.findRecord(tenantId);
    const templateCode = record?.templateCode as TemplateCode | undefined ?? DEFAULT_TEMPLATE_CODE;
    const published = mergeStorefrontConfig(templateCode, (record?.publishedConfig ?? null) as never);
    const draft = mergeStorefrontConfig(templateCode, (record?.draftConfig ?? record?.publishedConfig ?? null) as never);

    return {
      templateCode,
      published,
      draft,
      hasUnpublishedChanges: JSON.stringify(draft) !== JSON.stringify(published),
      publishedAt: record?.publishedAt ?? null,
    };
  }

  async updateDraft(tenantId: string, dto: UpdateStorefrontConfigDraftDto) {
    const record = await this.findRecord(tenantId);
    const previousTemplateCode = record?.templateCode as TemplateCode | undefined;
    const templateCode: TemplateCode = dto.templateCode ?? previousTemplateCode ?? DEFAULT_TEMPLATE_CODE;
    const isTemplateSwitch = dto.templateCode !== undefined && dto.templateCode !== previousTemplateCode;
    const existing = mergeStorefrontConfig(
      previousTemplateCode ?? templateCode,
      (record?.draftConfig ?? record?.publishedConfig ?? null) as never,
    );
    // A template switch resets theme+layout to the NEW template's own
    // defaults - the builder's TemplatePicker already does this client-side,
    // but the reset has to be authoritative here too, not just trusted from
    // the caller, so any future integration that PATCHes `templateCode`
    // alone (per the marketplace-ready architecture goal) can't silently end
    // up with the new template's structure but the old one's colors.
    // sections/qr/seo/footer/favicon/og are preserved - business content
    // decisions, not part of the visual template.
    const templateDefaults = buildDefaultStorefrontConfig(templateCode);
    const current: StorefrontConfig = isTemplateSwitch
      ? { ...existing, theme: templateDefaults.theme, layout: templateDefaults.layout }
      : existing;

    if (dto.faviconMediaId) {
      await this.assertMediaBelongsToTenant(dto.faviconMediaId, tenantId);
    }
    if (dto.ogImageMediaId) {
      await this.assertMediaBelongsToTenant(dto.ogImageMediaId, tenantId);
    }

    const next: StorefrontConfig = {
      theme: { ...current.theme, ...dto.theme },
      layout: { ...current.layout, ...dto.layout },
      sections: { ...current.sections, ...dto.sections },
      qr: { ...current.qr, ...dto.qr },
      seo: { ...current.seo, ...dto.seo },
      footerText: dto.footerText !== undefined ? dto.footerText : current.footerText,
      faviconMediaId: dto.faviconMediaId !== undefined ? dto.faviconMediaId : current.faviconMediaId,
      ogImageMediaId: dto.ogImageMediaId !== undefined ? dto.ogImageMediaId : current.ogImageMediaId,
    };

    await tenantScopedPrisma.tenantStorefrontConfig.upsert({
      where: { tenantId },
      create: {
        tenantId,
        templateCode,
        templateVersion: TEMPLATE_DEFAULTS[templateCode].version,
        draftConfig: next as unknown as Prisma.InputJsonValue,
      },
      update: {
        templateCode,
        templateVersion: TEMPLATE_DEFAULTS[templateCode].version,
        draftConfig: next as unknown as Prisma.InputJsonValue,
      },
    });

    return { templateCode, config: next };
  }

  async publish(tenantId: string) {
    const record = await this.findRecord(tenantId);
    const templateCode: TemplateCode = (record?.templateCode as TemplateCode | undefined) ?? DEFAULT_TEMPLATE_CODE;
    const draft = mergeStorefrontConfig(templateCode, (record?.draftConfig ?? null) as never);

    this.assertContrastSafe(draft);

    const now = new Date();
    const updated = await tenantScopedPrisma.tenantStorefrontConfig.upsert({
      where: { tenantId },
      create: {
        tenantId,
        templateCode,
        templateVersion: TEMPLATE_DEFAULTS[templateCode].version,
        draftConfig: draft as unknown as Prisma.InputJsonValue,
        publishedConfig: draft as unknown as Prisma.InputJsonValue,
        publishedAt: now,
      },
      update: {
        publishedConfig: draft as unknown as Prisma.InputJsonValue,
        publishedAt: now,
      },
    });

    await tenantScopedPrisma.storefrontConfigRevision.create({
      data: {
        tenantId,
        templateCode,
        config: draft as unknown as Prisma.InputJsonValue,
        publishedAt: now,
      },
    });

    return { config: draft, publishedAt: updated.publishedAt };
  }

  // Re-publishes the revision immediately before the current one - the
  // simple "geri alma" the spec asks for (§13), without a full
  // revision-browsing UI. Requires at least 2 revisions to exist (the
  // current live one plus something to revert to).
  async revert(tenantId: string) {
    const revisions = await tenantScopedPrisma.storefrontConfigRevision.findMany({
      where: { tenantId },
      orderBy: { publishedAt: "desc" },
      take: 2,
    });

    if (revisions.length < 2) {
      throw new AppException(
        "NO_PREVIOUS_REVISION",
        "Geri alınacak önceki bir yayın bulunamadı.",
        HttpStatus.BAD_REQUEST,
      );
    }

    const previous = revisions[1];
    if (!previous) {
      throw new AppException(
        "NO_PREVIOUS_REVISION",
        "Geri alınacak önceki bir yayın bulunamadı.",
        HttpStatus.BAD_REQUEST,
      );
    }
    const templateCode = previous.templateCode as TemplateCode;
    const now = new Date();

    const updated = await tenantScopedPrisma.tenantStorefrontConfig.update({
      where: { tenantId },
      data: {
        templateCode,
        templateVersion: TEMPLATE_DEFAULTS[templateCode]?.version ?? 1,
        draftConfig: previous.config as Prisma.InputJsonValue,
        publishedConfig: previous.config as Prisma.InputJsonValue,
        publishedAt: now,
      },
    });

    await tenantScopedPrisma.storefrontConfigRevision.create({
      data: { tenantId, templateCode, config: previous.config as Prisma.InputJsonValue, publishedAt: now },
    });

    return {
      templateCode,
      config: mergeStorefrontConfig(templateCode, previous.config as never),
      publishedAt: updated.publishedAt,
    };
  }

  private findRecord(tenantId: string) {
    return tenantScopedPrisma.tenantStorefrontConfig.findUnique({ where: { tenantId } });
  }

  private async assertMediaBelongsToTenant(mediaId: string, tenantId: string): Promise<void> {
    const media = await prisma.media.findUnique({ where: { id: mediaId } });

    if (!media || media.tenantId !== tenantId) {
      throw new AppException(
        "MEDIA_TENANT_MISMATCH",
        "Belirtilen medya bu işletmeye ait değil.",
        HttpStatus.BAD_REQUEST,
        [{ field: "mediaId", message: "Medya bulunamadı veya başka bir işletmeye ait." }],
      );
    }
  }

  // Defense-in-depth backstop (spec §4: "Metin okunamaz hale geliyorsa
  // kaydetmeyi engelle"). The primary guard is client-side on the draft-save
  // action (so a business gets an immediate, in-context warning while still
  // being free to experiment) - this only runs at publish time, so it can
  // never be bypassed by calling the API directly, without also blocking
  // legitimate mid-edit draft saves.
  private assertContrastSafe(config: StorefrontConfig): void {
    const { text, mutedText, background } = config.theme;
    const textRatio = contrastRatio(text, background);
    const mutedRatio = contrastRatio(mutedText, background);

    if (!meetsWcagAA(textRatio) || !meetsWcagAA(mutedRatio)) {
      throw new AppException(
        "STOREFRONT_CONTRAST_TOO_LOW",
        "Metin renkleri arka planla yeterli kontrastı sağlamıyor, storefront yayınlanamadı.",
        HttpStatus.BAD_REQUEST,
        [{ field: "theme", message: "Metin ve arka plan rengi arasındaki kontrast WCAG AA (4.5:1) altında." }],
      );
    }
  }
}
