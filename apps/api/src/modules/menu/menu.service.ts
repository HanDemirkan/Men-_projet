import { Injectable, NotFoundException } from "@nestjs/common";
import { tenantScopedPrisma } from "@qr-platform/database";
import type { Prisma } from "@qr-platform/database";

import { requireTenantId } from "../../common/tenant/require-tenant-id";

import type { CreateMenuDto } from "./dto/create-menu.dto";
import type { UpdateMenuDto } from "./dto/update-menu.dto";

@Injectable()
export class MenuService {
  async create(dto: CreateMenuDto) {
    return tenantScopedPrisma.menu.create({
      data: {
        tenantId: requireTenantId(),
        name: dto.name,
        description: dto.description,
        status: dto.status,
        sortOrder: dto.sortOrder ?? (await this.nextSortOrder()),
        activeFrom: dto.activeFrom ? new Date(dto.activeFrom) : undefined,
        activeUntil: dto.activeUntil ? new Date(dto.activeUntil) : undefined,
      } satisfies Prisma.MenuUncheckedCreateInput,
    });
  }

  // See CategoryService.nextSortOrder's own comment - same defaulted-to-0,
  // tied-sortOrder issue applies to a tenant's own menus. No explicit
  // `where: { tenantId }` here - the tenant-scoped client injects it
  // automatically (see tenant-scoped-client.ts); writing it by hand is the
  // one thing that pattern explicitly forbids.
  private async nextSortOrder(): Promise<number> {
    const result = await tenantScopedPrisma.menu.aggregate({
      _max: { sortOrder: true },
    });
    return (result._max.sortOrder ?? -1) + 1;
  }

  list() {
    return tenantScopedPrisma.menu.findMany({ orderBy: { sortOrder: "asc" } });
  }

  async get(id: string) {
    const menu = await tenantScopedPrisma.menu.findUnique({ where: { id } });

    if (!menu) {
      throw new NotFoundException("Menü bulunamadı.");
    }

    return menu;
  }

  async update(id: string, dto: UpdateMenuDto) {
    await this.get(id);

    return tenantScopedPrisma.menu.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        status: dto.status,
        sortOrder: dto.sortOrder,
        activeFrom: dto.activeFrom ? new Date(dto.activeFrom) : undefined,
        activeUntil: dto.activeUntil ? new Date(dto.activeUntil) : undefined,
      },
    });
  }

  async remove(id: string): Promise<void> {
    await this.get(id);
    await tenantScopedPrisma.menu.delete({ where: { id } });
  }
}
