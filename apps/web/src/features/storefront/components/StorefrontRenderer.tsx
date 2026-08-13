"use client";

import type { StorefrontConfig } from "@qr-platform/shared";
import { SearchInput } from "@qr-platform/ui";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useMemo, useRef, useState } from "react";

import { CategoryBand } from "./CategoryBand";
import { FeaturedProducts } from "./FeaturedProducts";
import { InfoBlockList } from "./InfoBlockList";
import { QuickActions } from "./QuickActions";
import { RestaurantHeader } from "./RestaurantHeader";

import { duration, stagger } from "@/config/motion";
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
  // "home" mode only ever needs {id, name} (the summary menu list, no
  // category/product tree loaded); "menu" mode needs the full nested tree.
  // Array-of-union (not union-of-arrays) so `.filter(hasCategories)` below
  // narrows correctly.
  mode: "home" | "menu";
  menus: Array<StorefrontMenuSummary | StorefrontMenu>;
  menuSummaryHref?: string;
  // Only the one "canonical" instance on screen at a time should carry this
  // (e.g. the builder's always-visible sidebar preview) - StorefrontRenderer
  // is also mounted inside DevicePreview, so hardcoding it unconditionally
  // would produce duplicate test ids whenever both are visible together.
  testId?: string;
}

function hasCategories(menu: StorefrontMenuSummary | StorefrontMenu): menu is StorefrontMenu {
  return "categories" in menu;
}

// The one component that renders the storefront's actual visual layout,
// composing whichever hero/category-nav/product-card primitives the
// tenant's config (or template default) selects. Used identically by the
// real public routes (Server Component data flow, this component itself is
// "use client" for the nav/search interactivity) and the QR Builder's live
// preview (local draft state) - see Sprint 7 plan's "no separate mock
// preview component" decision.
export function StorefrontRenderer({ tenant, config, mode, menus, menuSummaryHref, testId }: StorefrontRendererProps) {
  const { theme, layout, sections } = config;
  const HeroComponent = HERO_REGISTRY[layout.hero].Component;
  const CategoryNavComponent = CATEGORY_NAV_REGISTRY[layout.categoryNav].Component;
  const FooterComponent = FOOTER_REGISTRY[layout.footerStyle].Component;

  const fullMenus = useMemo(() => menus.filter(hasCategories), [menus]);

  const categories = useMemo(() => {
    const items: CategoryNavItem[] = [];
    for (const menu of fullMenus) {
      for (const category of menu.categories) {
        items.push({ id: category.id, name: category.name, imageId: category.imageId, productCount: category.products.length });
      }
    }
    return items;
  }, [menus]);

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

  // Whether the chosen hero actually has a tall cover photo to float the
  // fixed RestaurantHeader over - mirrors each hero primitive's own
  // `showCover` check (see FullCoverHero/DarkOverlayHero), computed once
  // here since the header needs to know before the hero itself renders.
  const hasHero = Boolean(sections.cover && tenant.coverImageId && layout.coverHeight !== "none");

  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(categories[0]?.id ?? null);
  const [query, setQuery] = useState("");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [availableOnly, setAvailableOnly] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  function handleCategorySelect(categoryId: string): void {
    setActiveCategoryId(categoryId);
    document.getElementById(`sf-category-${categoryId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleHeaderSearchClick(): void {
    searchInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    searchInputRef.current?.focus();
  }

  const normalizedQuery = query.trim().toLowerCase();
  const isFiltering = normalizedQuery.length > 0 || featuredOnly || availableOnly;

  function matchesFilters(product: { name: string; isFeatured: boolean; isAvailable: boolean }): boolean {
    if (normalizedQuery && !product.name.toLowerCase().includes(normalizedQuery)) {
      return false;
    }
    if (featuredOnly && !product.isFeatured) {
      return false;
    }
    if (availableOnly && !product.isAvailable) {
      return false;
    }
    return true;
  }

  const ProductCardComponent = PRODUCT_CARD_REGISTRY[layout.productCard].Component;
  const totalProducts = categories.reduce((sum, c) => sum + c.productCount, 0);

  return (
    <div
      data-testid={testId}
      style={{ ...themeToCssVars(theme), ...layoutToCssVars(layout), backgroundColor: "var(--sf-background)", ...backgroundTextureStyle(theme, layout) }}
      // `transition-colors` here (not an entrance animation) is deliberate:
      // it only smooths CHANGES after first paint - a live theme edit in the
      // builder's preview eases instead of snapping - and has zero effect on
      // initial render, unlike an opacity-gated entrance would. See
      // [tenantSlug]/layout.tsx's comment for why this component doesn't use
      // one of those: a real Lighthouse audit earlier in this sprint found
      // that pattern can produce a genuine NO_FCP result on this exact route.
      className="relative flex min-h-full flex-col font-[family-name:var(--sf-font-body)] transition-colors duration-normal"
    >
      <RestaurantHeader tenant={tenant} onSearchClick={handleHeaderSearchClick} hasHero={hasHero} />
      <div className={hasHero ? undefined : "pt-14"}>
        <HeroComponent tenant={tenant} theme={theme} layout={layout} sections={sections} />
      </div>
      <QuickActions tenant={tenant} />
      <FeaturedProducts products={featuredProducts} tenantSlug={tenant.slug} />

      {mode === "home" && sections.menus && menus.length > 0 ? (
        <div className="flex flex-col gap-2 px-5 pb-6">
          <p className={`font-[family-name:var(--sf-font-heading)] font-semibold ${headingSizeClassName(theme)}`} style={{ color: "var(--sf-text)" }}>
            Menüler
          </p>
          {menus.map((menu) => (
            <Link
              key={menu.id}
              href={menuSummaryHref ?? "#"}
              className="p-3.5 text-left font-[family-name:var(--sf-font-body)] text-sm font-medium transition-transform duration-fast active:scale-[0.98]"
              style={{ backgroundColor: "var(--sf-surface)", border: "1px solid var(--sf-border)", borderRadius: "var(--sf-radius)", color: "var(--sf-text)" }}
            >
              {menu.name}
            </Link>
          ))}
        </div>
      ) : null}

      {mode === "menu" ? (
        // A real element, not a Fragment: `sticky` resolves its containing
        // block against the nearest ancestor DOM node, and a Fragment
        // contributes none - without this wrapper, the search/category-nav
        // bar below stayed pinned all the way through the business-info
        // section and footer instead of releasing once the menu itself
        // ended (a real, confirmed bug, not a hypothetical one).
        <div>
          {/* Single sticky wrapper for search+filters AND the category nav
              (when it's the sticky-tabs variant) - two independent `sticky
              top-0` siblings would both pin to the same y=0 and overlap
              instead of stacking. The nav primitives themselves stay
              position-agnostic; only this shared shell decides stickiness. */}
          {totalProducts > 0 || (!isFiltering && categories.length > 1) ? (
            // top-14, not top-0: RestaurantHeader is `fixed` at the true
            // top-0/z-30 - without this offset this wrapper's own sticky
            // position would land directly underneath it.
            <div className="sticky top-14 z-20" style={{ backgroundColor: "var(--sf-background)" }}>
              {totalProducts > 0 ? (
                <div className="flex flex-col gap-2 px-3 py-2">
                  <SearchInput ref={searchInputRef} value={query} onChange={setQuery} placeholder="Menüde ara..." aria-label="Menüde ara" />
                  <div className="flex gap-2 px-1">
                    <FilterChip active={featuredOnly} onClick={() => setFeaturedOnly((v) => !v)} label="Öne Çıkanlar" icon={<Star className="h-3 w-3" aria-hidden="true" />} />
                    <FilterChip active={availableOnly} onClick={() => setAvailableOnly((v) => !v)} label="Stokta Olanlar" />
                  </div>
                </div>
              ) : null}

              {!isFiltering && categories.length > 1 ? (
                <CategoryNavComponent categories={categories} activeCategoryId={activeCategoryId} onSelect={handleCategorySelect} />
              ) : null}
            </div>
          ) : null}

          <div className="flex flex-col gap-6 px-3 py-4">
            {totalProducts === 0 ? (
              <EmptyState message="Menü henüz yayınlanmadı." />
            ) : (
              fullMenus.map((menu) =>
                menu.categories.map((category) => {
                  const filteredProducts = category.products.filter(matchesFilters);
                  if (isFiltering && filteredProducts.length === 0) {
                    return null;
                  }
                  return (
                    <section key={category.id} id={`sf-category-${category.id}`} className="flex flex-col gap-3 scroll-mt-32">
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
                          {filteredProducts.map((product, index) => (
                            <motion.div
                              key={product.id}
                              initial={{ opacity: 0, y: 8 }}
                              // `animate`, not `whileInView`: an
                              // IntersectionObserver-gated reveal left cards
                              // below the fold stuck at opacity:0 forever
                              // whenever the observer never fired (no
                              // scroll, fast/flung scroll, or a full-page
                              // capture) - a real content-visibility bug
                              // that also violates Sprint 8's own "content
                              // visible immediately on load" requirement.
                              // `animate` fires on mount instead, so every
                              // card resolves to visible unconditionally.
                              animate={{ opacity: 1, y: 0 }}
                              // Capped at 6 - a long list shouldn't make the
                              // 20th card wait nearly a second to reveal.
                              transition={{ duration: duration.fast, delay: Math.min(index, 6) * stagger.small }}
                            >
                              <ProductCardComponent
                                product={product}
                                theme={theme}
                                layout={layout}
                                href={`/${tenant.slug}/product/${product.slug}`}
                              />
                            </motion.div>
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
          </div>
        </div>
      ) : null}

      {/* BusinessStory / WorkingHours / Location / SocialLinks - deliberately
          LAST, after the menu itself (Sprint 8 page architecture item 2):
          the product is the reason someone scanned the code, business info
          is the closing chapter, not competing with it above the fold. */}
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
      className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-fast"
      style={{
        backgroundColor: active ? "var(--sf-primary)" : "var(--sf-surface)",
        color: active ? "var(--sf-primary-foreground)" : "var(--sf-muted-text)",
        border: active ? "none" : "1px solid var(--sf-border)",
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-1 px-5 py-12 text-center">
      <p className="font-[family-name:var(--sf-font-body)] text-sm" style={{ color: "var(--sf-muted-text)" }}>
        {message}
      </p>
    </div>
  );
}

