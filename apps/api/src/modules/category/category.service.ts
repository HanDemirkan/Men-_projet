import { HttpStatus, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, tenantScopedPrisma } from "@qr-platform/database";

import type { ReorderDto } from "../../common/dto/reorder.dto";
import { AppException } from "../../common/exceptions/app.exception";
import { slugify } from "../../common/slugify";
import { requireTenantId } from "../../common/tenant/require-tenant-id";

import type { CreateCategoryDto } from "./dto/create-category.dto";
import type { UpdateCategoryDto } from "./dto/update-category.dto";

@Injectable()
export class CategoryService {
  async create(menuId: string, dto: CreateCategoryDto) {
    await this.assertMenuExists(menuId);

    try {
      return await tenantScopedPrisma.category.create({
        data: {
          tenantId: requireTenantId(),
          menuId,
          name: dto.name,
          slug: dto.slug ?? slugify(dto.name),
          description: dto.description,
          imageId: dto.imageId,
          sortOrder: dto.sortOrder ?? (await this.nextSortOrder(menuId)),
          active: dto.active,
        } satisfies Prisma.CategoryUncheckedCreateInput,
      });
    } catch (error) {
      this.rethrowSlugConflict(error);
    }
  }

  // Every category's `sortOrder` defaults to 0 in the schema, and the
  // create form never sends one explicitly - without this, every new
  // category in a menu ties at 0, and Postgres's tie-break order for
  // `ORDER BY sortOrder ASC` among equal values is unspecified, not
  // creation order. That made a freshly created category's position in its
  // own menu genuinely nondeterministic for real users, not just tests
  // (confirmed root cause of e2e list-order flakiness - Sprint 8 hardening).
  private async nextSortOrder(menuId: string): Promise<number> {
    const result = await tenantScopedPrisma.category.aggregate({
      where: { menuId },
      _max: { sortOrder: true },
    });
    return (result._max.sortOrder ?? -1) + 1;
  }

  async listByMenu(menuId: string) {
    await this.assertMenuExists(menuId);

    return tenantScopedPrisma.category.findMany({
      where: { menuId },
      orderBy: { sortOrder: "asc" },
    });
  }

  // Sprint 8 perf: the tenant-wide category list (e.g. the business
  // Products page's category picker) previously fetched `/menus` then
  // issued one `/menus/:id/categories` call per menu in parallel - 1+N HTTP
  // round-trips for what's really a single query. This replaces that whole
  // client-side fan-out with one call, joining the menu name in the same
  // query instead of a second lookup.
  async listAllWithMenuName() {
    const categories = await tenantScopedPrisma.category.findMany({
      orderBy: [{ menu: { sortOrder: "asc" } }, { sortOrder: "asc" }],
      include: { menu: { select: { name: true } } },
    });

    return categories.map(({ menu, ...category }) => ({ ...category, menuName: menu.name }));
  }

  async get(id: string) {
    const category = await tenantScopedPrisma.category.findUnique({ where: { id } });

    if (!category) {
      throw new NotFoundException("Kategori bulunamadı.");
    }

    return category;
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.get(id);

    try {
      return await tenantScopedPrisma.category.update({
        where: { id },
        data: {
          name: dto.name,
          slug: dto.slug,
          description: dto.description,
          imageId: dto.imageId,
          sortOrder: dto.sortOrder,
          active: dto.active,
        },
      });
    } catch (error) {
      this.rethrowSlugConflict(error);
    }
  }

  async remove(id: string): Promise<void> {
    await this.get(id);
    await tenantScopedPrisma.category.delete({ where: { id } });
  }

  async reorder(dto: ReorderDto): Promise<void> {
    // One query for every id's existence, not one round-trip per item.
    const ids = dto.items.map((item) => item.id);
    const existing = await tenantScopedPrisma.category.findMany({ where: { id: { in: ids } }, select: { id: true } });

    if (existing.length !== ids.length) {
      throw new NotFoundException("Kategori bulunamadı.");
    }

    await tenantScopedPrisma.$transaction(
      dto.items.map((item) =>
        tenantScopedPrisma.category.update({ where: { id: item.id }, data: { sortOrder: item.sortOrder } }),
      ),
    );
  }

  private async assertMenuExists(menuId: string): Promise<void> {
    const menu = await tenantScopedPrisma.menu.findUnique({ where: { id: menuId } });

    if (!menu) {
      throw new NotFoundException("Menü bulunamadı.");
    }
  }

  private rethrowSlugConflict(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AppException(
        "SLUG_ALREADY_EXISTS",
        "Bu slug başka bir kategori tarafından kullanılıyor.",
        HttpStatus.CONFLICT,
        [{ field: "slug", message: "Bu slug zaten kullanımda." }],
      );
    }

    throw error;
  }
}
