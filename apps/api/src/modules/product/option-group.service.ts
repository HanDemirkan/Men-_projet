import { Injectable, NotFoundException } from "@nestjs/common";
import { tenantScopedPrisma } from "@qr-platform/database";
import type { Prisma } from "@qr-platform/database";

import type { ReorderDto } from "../../common/dto/reorder.dto";
import { requireTenantId } from "../../common/tenant/require-tenant-id";

import type { CreateOptionGroupDto } from "./dto/create-option-group.dto";
import type { UpdateOptionGroupDto } from "./dto/update-option-group.dto";

@Injectable()
export class OptionGroupService {
  async create(productId: string, dto: CreateOptionGroupDto) {
    await this.assertProductExists(productId);

    return tenantScopedPrisma.optionGroup.create({
      data: {
        tenantId: requireTenantId(),
        productId,
        name: dto.name,
        required: dto.required,
        multiple: dto.multiple,
        minimum: dto.minimum,
        maximum: dto.maximum,
        sortOrder: dto.sortOrder,
      } satisfies Prisma.OptionGroupUncheckedCreateInput,
    });
  }

  async listByProduct(productId: string) {
    await this.assertProductExists(productId);

    return tenantScopedPrisma.optionGroup.findMany({
      where: { productId },
      orderBy: { sortOrder: "asc" },
      include: { options: { orderBy: { sortOrder: "asc" } } },
    });
  }

  async get(id: string) {
    const optionGroup = await tenantScopedPrisma.optionGroup.findUnique({ where: { id } });

    if (!optionGroup) {
      throw new NotFoundException("Seçenek grubu bulunamadı.");
    }

    return optionGroup;
  }

  async update(id: string, dto: UpdateOptionGroupDto) {
    await this.get(id);

    return tenantScopedPrisma.optionGroup.update({
      where: { id },
      data: {
        name: dto.name,
        required: dto.required,
        multiple: dto.multiple,
        minimum: dto.minimum,
        maximum: dto.maximum,
        sortOrder: dto.sortOrder,
      },
    });
  }

  async remove(id: string): Promise<void> {
    await this.get(id);
    await tenantScopedPrisma.optionGroup.delete({ where: { id } });
  }

  async reorder(dto: ReorderDto): Promise<void> {
    const ids = dto.items.map((item) => item.id);
    const existing = await tenantScopedPrisma.optionGroup.findMany({ where: { id: { in: ids } }, select: { id: true } });

    if (existing.length !== ids.length) {
      throw new NotFoundException("Seçenek grubu bulunamadı.");
    }

    await tenantScopedPrisma.$transaction(
      dto.items.map((item) =>
        tenantScopedPrisma.optionGroup.update({ where: { id: item.id }, data: { sortOrder: item.sortOrder } }),
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
