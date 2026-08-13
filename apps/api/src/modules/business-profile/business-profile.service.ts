import { HttpStatus, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, prisma } from "@qr-platform/database";

import { AppException } from "../../common/exceptions/app.exception";

import type { UpdateBusinessProfileDto } from "./dto/update-business-profile.dto";

// Not tenant-scoped (see tenant-scoped-client.ts): Tenant IS the tenant, not
// tenant-owned data - filtered directly by the id CurrentTenant() resolves,
// using the raw `prisma` client, same pattern as AuditService/IdentityService.
@Injectable()
export class BusinessProfileService {
  async get(tenantId: string) {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });

    if (!tenant) {
      throw new NotFoundException("İşletme bulunamadı.");
    }

    return tenant;
  }

  async update(tenantId: string, dto: UpdateBusinessProfileDto) {
    if (dto.logoImageId !== undefined && dto.logoImageId !== null) {
      await this.assertMediaBelongsToTenant(dto.logoImageId, tenantId);
    }

    if (dto.coverImageId !== undefined && dto.coverImageId !== null) {
      await this.assertMediaBelongsToTenant(dto.coverImageId, tenantId);
    }

    const current = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } });

    if (!current) {
      throw new NotFoundException("İşletme bulunamadı.");
    }

    let updated;

    try {
      // `dto`'s all-optional shape is structurally ambiguous between
      // Prisma's "checked" (relation-based) and "unchecked" (raw scalar FK)
      // update input variants - we want the latter (`logoImageId` etc as
      // plain scalars, not `logoImage: { connect: ... }`).
      updated = await prisma.tenant.update({
        where: { id: tenantId },
        data: dto as Prisma.TenantUncheckedUpdateInput,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new AppException(
          "SLUG_ALREADY_EXISTS",
          "Bu slug başka bir işletme tarafından kullanılıyor.",
          HttpStatus.CONFLICT,
          [{ field: "slug", message: "Bu slug zaten kullanımda." }],
        );
      }

      throw error;
    }

    if (dto.slug !== undefined && dto.slug !== current.slug) {
      await this.archiveSlugChange(tenantId, current.slug, dto.slug);
    }

    return updated;
  }

  // QR permanence (see QrService / PublicStorefrontContextMiddleware): a
  // printed QR always encodes the slug at print time and is never reprinted,
  // so a rename must leave a trail. The just-released old slug is archived
  // pointing at this tenant so a stale scan 308-redirects instead of 404ing;
  // the newly-claimed slug's own alias row (if it happens to be someone's old
  // one) is dropped since an actively-claimed slug always wins resolution
  // over a stale alias - keeping it around would just be dead data.
  private async archiveSlugChange(tenantId: string, oldSlug: string, newSlug: string): Promise<void> {
    await prisma.tenantSlugAlias.deleteMany({ where: { oldSlug: newSlug } });
    await prisma.tenantSlugAlias.upsert({
      where: { oldSlug },
      create: { oldSlug, tenantId },
      update: { tenantId },
    });
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
}
