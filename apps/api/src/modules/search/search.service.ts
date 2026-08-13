import { Injectable } from "@nestjs/common";
import { tenantScopedPrisma } from "@qr-platform/database";

export type SearchResultType = "product" | "category" | "variant" | "option";

export interface SearchResult {
  type: SearchResultType;
  id: string;
  name: string;
  breadcrumb: string;
  categoryId: string;
}

const RESULT_LIMIT_PER_TYPE = 8;

// Real Postgres `contains`+`insensitive` queries, tenant-scoped - not a
// mocked/static list. A dedicated search index (fuse.js, Postgres full-text)
// was deliberately not introduced: a single restaurant's catalog is small
// enough that ILIKE against indexed name columns is genuinely fast, and it
// keeps this a zero-new-infrastructure feature - see ADR 0009.
@Injectable()
export class SearchService {
  async search(query: string): Promise<SearchResult[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const [products, categories, variants, options] = await Promise.all([
      tenantScopedPrisma.product.findMany({
        where: { name: { contains: query, mode: "insensitive" }, deletedAt: null },
        take: RESULT_LIMIT_PER_TYPE,
        include: { category: true },
      }),
      tenantScopedPrisma.category.findMany({
        where: { name: { contains: query, mode: "insensitive" } },
        take: RESULT_LIMIT_PER_TYPE,
        include: { menu: true },
      }),
      tenantScopedPrisma.variant.findMany({
        where: { name: { contains: query, mode: "insensitive" } },
        take: RESULT_LIMIT_PER_TYPE,
        include: { product: { include: { category: true } } },
      }),
      tenantScopedPrisma.option.findMany({
        where: { name: { contains: query, mode: "insensitive" } },
        take: RESULT_LIMIT_PER_TYPE,
        include: { optionGroup: { include: { product: { include: { category: true } } } } },
      }),
    ]);

    return [
      ...products.map((product) => ({
        type: "product" as const,
        id: product.id,
        name: product.name,
        breadcrumb: product.category.name,
        categoryId: product.categoryId,
      })),
      ...categories.map((category) => ({
        type: "category" as const,
        id: category.id,
        name: category.name,
        breadcrumb: category.menu.name,
        categoryId: category.id,
      })),
      ...variants
        .filter((variant) => !variant.product.deletedAt)
        .map((variant) => ({
          type: "variant" as const,
          id: variant.id,
          name: variant.name,
          breadcrumb: variant.product.name,
          categoryId: variant.product.categoryId,
        })),
      ...options
        .filter((option) => !option.optionGroup.product.deletedAt)
        .map((option) => ({
          type: "option" as const,
          id: option.id,
          name: option.name,
          breadcrumb: option.optionGroup.product.name,
          categoryId: option.optionGroup.product.categoryId,
        })),
    ];
  }
}
