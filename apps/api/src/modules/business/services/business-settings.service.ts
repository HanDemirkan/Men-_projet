import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, prisma } from "@qr-platform/database";

import { requireTenantId } from "../../../common/tenant/require-tenant-id";
import { AuditService } from "../../audit/audit.service";
import type { AuthenticatedUser } from "../../auth/types/authenticated-user.types";
import type { UpdateSettingsDto } from "../dto/update-settings.dto";
import type { BusinessSettings, BusinessSettingsData } from "../types/business-settings.types";
import { DEFAULT_BUSINESS_SETTINGS } from "../types/business-settings.types";
import type { RequestMetadata } from "../types/request-metadata";

// Not tenant-scoped (Tenant IS the tenant, not tenant-owned data) - same
// raw-`prisma` pattern as BusinessProfileService. `language`/`currency` are
// read from Tenant's own flat columns (shared with /business-profile, see
// UpdateSettingsDto's comment) rather than duplicated inside the JSON blob.
@Injectable()
export class BusinessSettingsService {
  constructor(private readonly auditService: AuditService) {}

  async get(): Promise<BusinessSettings> {
    const tenant = await prisma.tenant.findUniqueOrThrow({ where: { id: requireTenantId() } });
    return this.toBusinessSettings(tenant.language, tenant.currency, tenant.status, tenant.businessSettings);
  }

  async update(dto: UpdateSettingsDto, actor: AuthenticatedUser, meta: RequestMetadata): Promise<BusinessSettings> {
    const tenantId = requireTenantId();
    const before = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!before) {
      throw new NotFoundException("İşletme bulunamadı.");
    }

    const beforeSettings = this.mergeWithDefaults(before.businessSettings);
    const merged: BusinessSettingsData = {
      timezone: dto.timezone ?? beforeSettings.timezone,
      dateFormat: dto.dateFormat ?? beforeSettings.dateFormat,
      priceDisplayFormat: dto.priceDisplayFormat ?? beforeSettings.priceDisplayFormat,
      qrDefaults: {
        errorCorrectionLevel: dto.qrDefaults?.errorCorrectionLevel ?? beforeSettings.qrDefaults.errorCorrectionLevel,
        includeLogo: dto.qrDefaults?.includeLogo ?? beforeSettings.qrDefaults.includeLogo,
      },
    };

    const updated = await prisma.tenant.update({
      where: { id: tenantId },
      data: { businessSettings: merged as unknown as Prisma.InputJsonValue },
    });

    await this.auditService.log({
      tenantId,
      userId: actor.userId,
      action: "business.settings.update",
      entity: "Tenant",
      entityId: tenantId,
      requestId: meta.requestId,
      ip: meta.ip,
      userAgent: meta.userAgent,
      oldValue: beforeSettings as unknown as Prisma.InputJsonValue,
      newValue: merged as unknown as Prisma.InputJsonValue,
    });

    return this.toBusinessSettings(updated.language, updated.currency, updated.status, updated.businessSettings);
  }

  private mergeWithDefaults(raw: unknown): BusinessSettingsData {
    if (!raw || typeof raw !== "object") {
      return DEFAULT_BUSINESS_SETTINGS;
    }

    const partial = raw as Partial<BusinessSettingsData>;
    return {
      timezone: partial.timezone ?? DEFAULT_BUSINESS_SETTINGS.timezone,
      dateFormat: partial.dateFormat ?? DEFAULT_BUSINESS_SETTINGS.dateFormat,
      priceDisplayFormat: partial.priceDisplayFormat ?? DEFAULT_BUSINESS_SETTINGS.priceDisplayFormat,
      qrDefaults: {
        errorCorrectionLevel:
          partial.qrDefaults?.errorCorrectionLevel ?? DEFAULT_BUSINESS_SETTINGS.qrDefaults.errorCorrectionLevel,
        includeLogo: partial.qrDefaults?.includeLogo ?? DEFAULT_BUSINESS_SETTINGS.qrDefaults.includeLogo,
      },
    };
  }

  private toBusinessSettings(
    language: string,
    currency: string,
    tenantStatus: string,
    rawSettings: unknown,
  ): BusinessSettings {
    return { language, currency, tenantStatus, ...this.mergeWithDefaults(rawSettings) };
  }
}
