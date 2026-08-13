"use client";

import type { StorefrontConfig } from "@qr-platform/shared";
import { SearchInput } from "@qr-platform/ui";
import { Star } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useMemo, useRef, useState } from "react";

import { CategoryBand } from "./CategoryBand";
import { FeaturedProducts } from "./FeaturedProducts";
import { InfoBlockList } from "./InfoBlockList";
import { QuickActions } from "./QuickActions";
import { RestaurantHeader } from "./RestaurantHeader";

import { CATEGORY_NAV_REGISTRY } from "@/features/storefront/primitives/category-nav";
import type { CategoryNavItem } from "@/features/storefront/primitives/category-nav";
import { FOOTER_REGISTRY } from "@/features/storefront/primitives/footer";
import { HERO_REGISTRY } from "@/features/storefront/primitives/hero";
import { PRODUCT_CARD_REGISTRY, productCardGridClassName } from "@/features/storefront/primitives/product-card";
import { backgroundTextureStyle, bodySizeClassName, headingSizeClassName, layoutToCssVars, themeToCssVars } from "@/features/storefront/theme-to-css";
import type { Product } from "@/types/catalog";
import type { PublicTenant, StorefrontMenu, StorefrontMenuSummary } from "@/types/storefront";

export interface StorefrontRendererProps {
  tenant: PublicTenant;
  config: StorefrontConfig;
  mode: "home" | "menu";
  menus: Array<StorefrontMenuSummary | StorefrontMenu>;
  menuSummaryHref?: string;
  testId?: string;
}

function hasCategories(menu: StorefrontMenuSummary | StorefrontMenu): menu is StorefrontMenu {
  return "categories" in menu;
}

export function StorefrontRenderer({ tenant, config, mode, menus, menuSummaryHref, testId }: StorefrontRendererProps) {
  const { theme, layout, sections } = config;
  const HeroComponent = HERO_REGISTRY[layout.hero].Component;
  const CategoryNavComponent = CATEGORY_NAV_REGISTRY[layout.categoryNav].Component;
  const FooterComponent = FOOTER_REGISTRY[layout.footerStyle].Component;
  const ProductCardComponent = PRODUCT_CARD_REGISTRY[layout.productCard].Component;

  const fullMenus = useMemo(() => menus.filter(hasCategories), [menus]);
  const categories = useMemo(() => {
    const items: CategoryNavItem[] = [];
    for (const menu of fullMenus) {
      for (const category of menu.categories) {
        items.push({ id: category.id, name: category.name, imageId: category.imageId, productCount: category.products.length });
      }
    }
    return items;
  }, [fullMenus]);
  const featuredProducts = useMemo(() => {
    const items: Product[] = [];
    for (const menu of fullMenus) {
      for (const category of menu.categories) {
        for (const product of category.products) {
          if (product.isFeatured && product.isAvailable) {
            items.push(product);
          }
        }
      }
    }
    return items;
  }, [fullMenus]);

  const hasHero = Boolean(sections.cover && tenant.coverImageId && layout.coverHeight !== "none");
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(categories[0]?.id ?? null);
  const [query, setQuery] = useState("");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [availableOnly, setAvailableOnly] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const normalizedQuery = query.trim().toLocaleLowerCase("tr-TR");
  const isFiltering = Boolean(normalizedQuery || featuredOnly || availableOnly);
  const totalProducts = categories.reduce((sum, category) => sum + category.productCount, 0);

  function matchesFilters(product: { name: string; isFeatured: boolean; isAvailable: boolean }): boolean {
    return (
      (!normalizedQuery || product.name.toLocaleLowerCase("tr-TR").includes(normalizedQuery)) &&
      (!featuredOnly || product.isFeatured) &&
      (!availableOnly || product.isAvailable)
    );
  }

  function handleCategorySelect(categoryId: string): void {
    setActiveCategoryId(categoryId);
    document.getElementById(`sf-category-${categoryId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleHeaderSearchClick(): void {
    searchInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    searchInputRef.current?.focus();
  }

  return (
    <div
      data-testid={testId}
      style={{
        ...themeToCssVars(theme),
        ...layoutToCssVars(layout),
        backgroundColor: "var(--sf-background)",
        ...backgroundTextureStyle(theme, layout),
      }}
      className="relative flex min-h-dvh flex-col font-[family-name:var(--sf-font-body)] transition-colors duration-normal"
    >
      <RestaurantHeader tenant={tenant} onSearchClick={handleHeaderSearchClick} hasHero={hasHero} />
      <div className={hasHero ? undefined : "pt-14"}>
        <HeroComponent tenant={tenant} theme={theme} layout={layout} sections={sections} />
      </div>
      <QuickActions tenant={tenant} />
      {mode === "menu" ? <FeaturedProducts products={featuredProducts} tenantSlug={tenant.slug} /> : null}

      {mode === "home" && sections.menus && menus.length > 0 ? (
        <section className="px-5 pb-8">
          <div className="mb-3 flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--sf-primary)" }}>
                Keşfet
              </p>
              <h2 className={`mt-1 font-[family-name:var(--sf-font-heading)] font-semibold ${headingSizeClassName(theme)}`} style={{ color: "var(--sf-text)" }}>
                Menüler
              </h2>
            </div>
            <span className="text-xs" style={{ color: "var(--sf-muted-text)" }}>{menus.length} menü</span>
          </div>
          <div className="grid gap-2.5">
            {menus.map((menu, index) => (
              <Link
                key={menu.id}
                href={menuSummaryHref ?? "#"}
                className="group flex items-center justify-between gap-4 p-4 transition-[transform,box-shadow] duration-fast active:scale-[0.99]"
                style={{
                  backgroundColor: "var(--sf-surface)",
                  border: "1px solid var(--sf-border)",
                  borderRadius: "var(--sf-radius)",
                  color: "var(--sf-text)",
                  boxShadow: "var(--sf-shadow)",
                }}
              >
                <div>
                  <span className="text-[10px] font-medium uppercase tracking-[0.16em]" style={{ color: "var(--sf-muted-text)" }}>
                    Menü {String(index + 1).padStart(2, "0")}
                  </span>
                  <p className="mt-0.5 font-[family-name:var(--sf-font-heading)] text-base font-semibold">{menu.name}</p>
                </div>
                <span className="text-lg transition-transform duration-fast group-hover:translate-x-0.5" aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {mode === "menu" ? (
        <div>
          {totalProducts > 0 || (!isFiltering && categories.length > 1) ? (
            <div
              className="sticky top-14 z-20 border-b backdrop-blur-xl"
              style={{
                backgroundColor: "color-mix(in srgb, var(--sf-background) 92%, transparent)",
                borderColor: "var(--sf-border)",
              }}
            >
              {totalProducts > 0 ? (
                <div className="flex flex-col gap-2 px-4 py-3">
                  <SearchInput ref={searchInputRef} value={query} onChange={setQuery} placeholder="Menüde ara..." aria-label="Menüde ara" />
                  <div className="flex gap-2 overflow-x-auto pb-0.5">
                    <FilterChip active={featuredOnly} onClick={() => setFeaturedOnly((value) => !value)} label="Öne Çıkanlar" icon={<Star className="h-3 w-3" aria-hidden="true" />} />
                    <FilterChip active={availableOnly} onClick={() => setAvailableOnly((value) => !value)} label="Stokta Olanlar" />
                  </div>
                </div>
              ) : null}
              {!isFiltering && categories.length > 1 ? (
                <CategoryNavComponent categories={categories} activeCategoryId={activeCategoryId} onSelect={handleCategorySelect} />
              ) : null}
            </div>
          ) : null}

          <main className="flex flex-col gap-10 px-4 py-7">
            {totalProducts === 0 ? (
              <EmptyState message="Menü henüz yayınlanmadı." />
            ) : (
              fullMenus.map((menu) =>
                menu.categories.map((category) => {
                  const filteredProducts = category.products.filter(matchesFilters);
                  if (isFiltering && filteredProducts.length === 0) return null;

                  return (
                    <section key={category.id} id={`sf-category-${category.id}`} className="flex scroll-mt-36 flex-col gap-4">
                      <CategoryBand
                        name={category.name}
                        description={category.description}
                        imageId={category.imageId}
                        productCount={category.products.length}
                        showBand={layout.coverHeight !== "none"}
                      />
                      {filteredProducts.length === 0 ? (
                        <p className={`font-[family-name:var(--sf-font-body)] ${bodySizeClassName(theme)}`} style={{ color: "var(--sf-muted-text)" }}>
                          Bu kategoride ürün yok.
                        </p>
                      ) : (
                        <div className={productCardGridClassName(layout.productCard)}>
                          {filteredProducts.map((product) => (
                            <div key={product.id} className="content-auto">
                              <ProductCardComponent
                                product={product}
                                theme={theme}
                                layout={layout}
                                href={`/${tenant.slug}/product/${product.slug}`}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </section>
                  );
                }),
              )
            )}
            {isFiltering && totalProducts > 0 && fullMenus.every((menu) => menu.categories.every((category) => category.products.filter(matchesFilters).length === 0)) ? (
              <EmptyState message="Aramanızla eşleşen ürün bulunamadı." />
            ) : null}
          </main>
        </div>
      ) : null}

      <InfoBlockList tenant={tenant} layout={layout} sections={sections} />
      <FooterComponent tenant={tenant} config={config} />
    </div>
  );
}

function FilterChip({ active, onClick, label, icon }: { active: boolean; onClick: () => void; label: string; icon?: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-[transform,background-color,color] duration-fast active:scale-95"
      style={{
        backgroundColor: active ? "var(--sf-primary)" : "var(--sf-surface)",
        color: active ? "var(--sf-primary-foreground)" : "var(--sf-muted-text)",
        border: `1px solid ${active ? "var(--sf-primary)" : "var(--sf-border)"}`,
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-1 px-5 py-14 text-center">
      <p className="font-[family-name:var(--sf-font-body)] text-sm" style={{ color: "var(--sf-muted-text)" }}>{message}</p>
    </div>
  );
}
