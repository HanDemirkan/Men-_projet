import { HttpStatus, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, tenantScopedPrisma } from "@qr-platform/database";

import type { ReorderDto } from "../../common/dto/reorder.dto";
import { AppException } from "../../common/exceptions/app.exception";
import { slugify } from "../../common/slugify";
import { requireTenantId } from "../../common/tenant/require-tenant-id";

import type { BulkUpdateProductsDto } from "./dto/bulk-update-products.dto";
import type { CreateProductDto } from "./dto/create-product.dto";
import type { UpdateProductDto } from "./dto/update-product.dto";

export type ProductListStatus = "active" | "archived" | "all";

@Injectable()
export class ProductService {
  async create(categoryId: string, dto: CreateProductDto) {
    await this.assertCategoryExists(categoryId);

    try {
      return await tenantScopedPrisma.product.create({
        data: {
          tenantId: requireTenantId(),
          categoryId,
          name: dto.name,
          slug: dto.slug ?? slugify(dto.name),
          description: dto.description,
          shortDescription: dto.shortDescription,
          price: dto.price,
          imageId: dto.imageId,
          preparationTime: dto.preparationTime,
          calories: dto.calories,
          allergens: dto.allergens,
          tags: dto.tags,
          isAvailable: dto.isAvailable,
          isFeatured: dto.isFeatured,
          sortOrder: dto.sortOrder ?? (await this.nextSortOrder(categoryId)),
        } satisfies Prisma.ProductUncheckedCreateInput,
      });
    } catch (error) {
      this.rethrowSlugConflict(error);
    }
  }

  // See CategoryService.nextSortOrder's own comment - same defaulted-to-0,
  // tied-sortOrder issue applies to products within a category.
  private async nextSortOrder(categoryId: string): Promise<number> {
    const result = await tenantScopedPrisma.product.aggregate({
      where: { categoryId },
      _max: { sortOrder: true },
    });
    return (result._max.sortOrder ?? -1) + 1;
  }

  async listByCategory(categoryId: string, status: ProductListStatus = "active") {
    await this.assertCategoryExists(categoryId);

    const deletedAtFilter =
      status === "active" ? { deletedAt: null } : status === "archived" ? { deletedAt: { not: null } } : {};

    return tenantScopedPrisma.product.findMany({
      where: { categoryId, ...deletedAtFilter },
      orderBy: { sortOrder: "asc" },
      include: { variants: true, optionGroups: { include: { options: true } } },
    });
  }

  async get(id: string) {
    const product = await tenantScopedPrisma.product.findUnique({
      where: { id },
      include: { variants: true, optionGroups: { include: { options: true } } },
    });

    if (!product || product.deletedAt) {
      throw new NotFoundException("Ürün bulunamadı.");
    }

    return product;
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.get(id);

    try {
      return await tenantScopedPrisma.product.update({
        where: { id },
        data: {
          name: dto.name,
          slug: dto.slug,
          description: dto.description,
          shortDescription: dto.shortDescription,
          price: dto.price,
          imageId: dto.imageId,
          preparationTime: dto.preparationTime,
          calories: dto.calories,
          allergens: dto.allergens,
          tags: dto.tags,
          isAvailable: dto.isAvailable,
          isFeatured: dto.isFeatured,
          sortOrder: dto.sortOrder,
        },
      });
    } catch (error) {
      this.rethrowSlugConflict(error);
    }
  }

  // Soft delete: sets `deletedAt` only. Variants/OptionGroups/Options are
  // left untouched (they simply stop being reachable through an active
  // product) - a hard delete of the product row still cascades them for
  // real, but that's not what a soft delete does by definition.
  async remove(id: string): Promise<void> {
    await this.get(id);
    await tenantScopedPrisma.product.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  // Reverses `remove()` - clears `deletedAt`. Looked up without the
  // deletedAt=null filter `get()` applies, since a restorable row is
  // expected to currently be soft-deleted.
  async restore(id: string) {
    const product = await tenantScopedPrisma.product.findUnique({ where: { id } });

    if (!product) {
      throw new NotFoundException("Ürün bulunamadı.");
    }

    return tenantScopedPrisma.product.update({ where: { id }, data: { deletedAt: null } });
  }

  // Real bulk SQL (one `updateMany`), not N sequential requests - `ids`
  // outside the tenant are silently excluded by tenantScopedPrisma's
  // automatic `where.tenantId` injection, same guarantee as every other
  // tenant-scoped query.
  async bulkUpdate(dto: BulkUpdateProductsDto): Promise<{ updated: number }> {
    const data: Prisma.ProductUncheckedUpdateManyInput = {};

    if (dto.data.isAvailable !== undefined) {
      data.isAvailable = dto.data.isAvailable;
    }
    if (dto.data.isFeatured !== undefined) {
      data.isFeatured = dto.data.isFeatured;
    }
    if (dto.data.archived !== undefined) {
      data.deletedAt = dto.data.archived ? new Date() : null;
    }

    const result = await tenantScopedPrisma.product.updateMany({
      where: { id: { in: dto.ids } },
      data,
    });

    return { updated: result.count };
  }

  // Deep-clones a product + its variants + option groups + options. Slug
  // gets a "-kopya" suffix (de-duplicated with -2, -3... on conflict since
  // the unique constraint is real and enforced, not just a UI nicety).
  async duplicate(id: string) {
    const source = await tenantScopedPrisma.product.findUnique({
      where: { id },
      include: { variants: true, optionGroups: { include: { options: true } } },
    });

    if (!source || source.deletedAt) {
      throw new NotFoundException("Ürün bulunamadı.");
    }

    const tenantId = requireTenantId();
    const baseSlug = `${source.slug}-kopya`;
    const slug = await this.findAvailableSlug(baseSlug);

    return tenantScopedPrisma.product.create({
      data: {
        tenantId,
        categoryId: source.categoryId,
        name: `${source.name} (Kopya)`,
        slug,
        description: source.description,
        shortDescription: source.shortDescription,
        price: source.price,
        imageId: source.imageId,
        preparationTime: source.preparationTime,
        calories: source.calories,
        allergens: source.allergens,
        isAvailable: source.isAvailable,
        isFeatured: false,
        sortOrder: source.sortOrder + 1,
        variants: {
          create: source.variants.map((variant) => ({
            tenantId,
            name: variant.name,
            price: variant.price,
            sortOrder: variant.sortOrder,
          })),
        },
        optionGroups: {
          create: source.optionGroups.map((group) => ({
            tenantId,
            name: group.name,
            required: group.required,
            multiple: group.multiple,
            minimum: group.minimum,
            maximum: group.maximum,
            sortOrder: group.sortOrder,
            options: {
              create: group.options.map((option) => ({
                tenantId,
                name: option.name,
                price: option.price,
                sortOrder: option.sortOrder,
                available: option.available,
              })),
            },
          })),
        },
      } satisfies Prisma.ProductUncheckedCreateInput,
      include: { variants: true, optionGroups: { include: { options: true } } },
    });
  }

  private async findAvailableSlug(baseSlug: string): Promise<string> {
    let candidate = baseSlug;
    let suffix = 2;

    while (await tenantScopedPrisma.product.findFirst({ where: { slug: candidate } })) {
      candidate = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    return candidate;
  }

  async reorder(dto: ReorderDto): Promise<void> {
    // One existence-check query for every id, not one round-trip (each
    // pulling full variants/optionGroups via this.get()) per item. Keeps
    // this.get()'s "soft-deleted doesn't count as existing" rule.
    const ids = dto.items.map((item) => item.id);
    const existing = await tenantScopedPrisma.product.findMany({
      where: { id: { in: ids }, deletedAt: null },
      select: { id: true },
    });

    if (existing.length !== ids.length) {
      throw new NotFoundException("Ürün bulunamadı.");
    }

    await tenantScopedPrisma.$transaction(
      dto.items.map((item) =>
        tenantScopedPrisma.product.update({ where: { id: item.id }, data: { sortOrder: item.sortOrder } }),
      ),
    );
  }

  private async assertCategoryExists(categoryId: string): Promise<void> {
    const category = await tenantScopedPrisma.category.findUnique({ where: { id: categoryId } });

    if (!category) {
      throw new NotFoundException("Kategori bulunamadı.");
    }
  }

  private rethrowSlugConflict(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AppException(
        "SLUG_ALREADY_EXISTS",
        "Bu slug başka bir ürün tarafından kullanılıyor.",
        HttpStatus.CONFLICT,
        [{ field: "slug", message: "Bu slug zaten kullanımda." }],
      );
    }

    throw error;
  }
}
