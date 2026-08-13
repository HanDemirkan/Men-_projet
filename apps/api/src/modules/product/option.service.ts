import { Injectable, NotFoundException } from "@nestjs/common";
import { tenantScopedPrisma } from "@qr-platform/database";
import type { Prisma } from "@qr-platform/database";

import type { ReorderDto } from "../../common/dto/reorder.dto";
import { requireTenantId } from "../../common/tenant/require-tenant-id";

import type { CreateOptionDto } from "./dto/create-option.dto";
import type { UpdateOptionDto } from "./dto/update-option.dto";

@Injectable()
export class OptionService {
  async create(optionGroupId: string, dto: CreateOptionDto) {
    await this.assertOptionGroupExists(optionGroupId);

    return tenantScopedPrisma.option.create({
      data: {
        tenantId: requireTenantId(),
        optionGroupId,
        name: dto.name,
        price: dto.price,
        sortOrder: dto.sortOrder,
        available: dto.available,
      } satisfies Prisma.OptionUncheckedCreateInput,
    });
  }

  async listByOptionGroup(optionGroupId: string) {
    await this.assertOptionGroupExists(optionGroupId);

    return tenantScopedPrisma.option.findMany({
      where: { optionGroupId },
      orderBy: { sortOrder: "asc" },
    });
  }

  async get(id: string) {
    const option = await tenantScopedPrisma.option.findUnique({ where: { id } });

    if (!option) {
      throw new NotFoundException("Seçenek bulunamadı.");
    }

    return option;
  }

  async update(id: string, dto: UpdateOptionDto) {
    await this.get(id);

    return tenantScopedPrisma.option.update({
      where: { id },
      data: { name: dto.name, price: dto.price, sortOrder: dto.sortOrder, available: dto.available },
    });
  }

  async remove(id: string): Promise<void> {
    await this.get(id);
    await tenantScopedPrisma.option.delete({ where: { id } });
  }

  async reorder(dto: ReorderDto): Promise<void> {
    const ids = dto.items.map((item) => item.id);
    const existing = await tenantScopedPrisma.option.findMany({ where: { id: { in: ids } }, select: { id: true } });

    if (existing.length !== ids.length) {
      throw new NotFoundException("Seçenek bulunamadı.");
    }

    await tenantScopedPrisma.$transaction(
      dto.items.map((item) =>
        tenantScopedPrisma.option.update({ where: { id: item.id }, data: { sortOrder: item.sortOrder } }),
      ),
    );
  }

  private async assertOptionGroupExists(optionGroupId: string): Promise<void> {
    const optionGroup = await tenantScopedPrisma.optionGroup.findUnique({ where: { id: optionGroupId } });

    if (!optionGroup) {
      throw new NotFoundException("Seçenek grubu bulunamadı.");
    }
  }
}
