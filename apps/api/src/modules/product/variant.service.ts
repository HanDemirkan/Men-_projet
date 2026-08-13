import { Injectable, NotFoundException } from "@nestjs/common";
import { tenantScopedPrisma } from "@qr-platform/database";
import type { Prisma } from "@qr-platform/database";

import type { ReorderDto } from "../../common/dto/reorder.dto";
import { requireTenantId } from "../../common/tenant/require-tenant-id";

import type { CreateVariantDto } from "./dto/create-variant.dto";
import type { UpdateVariantDto } from "./dto/update-variant.dto";

@Injectable()
export class VariantService {
  async create(productId: string, dto: CreateVariantDto) {
    await this.assertProductExists(productId);

    return tenantScopedPrisma.variant.create({
      data: {
        tenantId: requireTenantId(),
        productId,
        name: dto.name,
        price: dto.price,
        sortOrder: dto.sortOrder,
      } satisfies Prisma.VariantUncheckedCreateInput,
    });
  }

  async listByProduct(productId: string) {
    await this.assertProductExists(productId);

    return tenantScopedPrisma.variant.findMany({ where: { productId }, orderBy: { sortOrder: "asc" } });
  }

  async get(id: string) {
    const variant = await tenantScopedPrisma.variant.findUnique({ where: { id } });

    if (!variant) {
      throw new NotFoundException("Variant bulunamadı.");
    }

    return variant;
  }

  async update(id: string, dto: UpdateVariantDto) {
    await this.get(id);

    return tenantScopedPrisma.variant.update({
      where: { id },
      data: { name: dto.name, price: dto.price, sortOrder: dto.sortOrder },
    });
  }

  async remove(id: string): Promise<void> {
    await this.get(id);
    await tenantScopedPrisma.variant.delete({ where: { id } });
  }

  async reorder(dto: ReorderDto): Promise<void> {
    const ids = dto.items.map((item) => item.id);
    const existing = await tenantScopedPrisma.variant.findMany({ where: { id: { in: ids } }, select: { id: true } });

    if (existing.length !== ids.length) {
      throw new NotFoundException("Variant bulunamadı.");
    }

    await tenantScopedPrisma.$transaction(
      dto.items.map((item) =>
        tenantScopedPrisma.variant.update({ where: { id: item.id }, data: { sortOrder: item.sortOrder } }),
      ),
    );
  }

  private async assertProductExists(productId: string): Promise<void> {
    const product = await tenantScopedPrisma.product.findUnique({ where: { id: productId } });

    if (!product || product.deletedAt) {
      throw new NotFoundException("Ürün bulunamadı.");
    }
  }
}
