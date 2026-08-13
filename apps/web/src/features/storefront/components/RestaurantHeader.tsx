"use client";

import { Search } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { mediaFileUrl } from "@/services/media.service";
import type { PublicTenant } from "@/types/storefront";

export interface RestaurantHeaderProps {
  tenant: PublicTenant;
  onSearchClick?: () => void;
  // Whether there's a hero tall enough to float over. Without one (e.g. the
  // Minimal Coffee template chooses no cover), the header renders solid from
  // the start instead of pretending there's something transparent to sit on.
  hasHero: boolean;
}

// Sprint 8 redesign item 3: a real persistent header, not just a hero that
// scrolls away. Floats transparent over the hero (so the photo reads
// full-bleed, not letterboxed under a bar) and crossfades to a solid,
// shadowed bar once scrolled - an IntersectionObserver on a 1px sentinel at
// the hero's own end, not a scroll-position listener recalculating layout
// on every frame.
export function RestaurantHeader({ tenant, onSearchClick, hasHero }: RestaurantHeaderProps) {
  const [scrolled, setScrolled] = useState(!hasHero);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasHero || !sentinelRef.current) {
      return;
    }
    const el = sentinelRef.current;
    const observer = new IntersectionObserver(([entry]) => setScrolled(!(entry?.isIntersecting ?? true)), { threshold: 0 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasHero]);

  return (
    <>
      {hasHero ? <div ref={sentinelRef} className="pointer-events-none absolute inset-x-0 top-0 h-px" aria-hidden="true" /> : null}
      <header
        className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between gap-3 px-4 transition-colors duration-normal"
        style={{
          backgroundColor: scrolled ? "var(--sf-surface)" : "transparent",
          boxShadow: scrolled ? "0 1px 0 var(--sf-border)" : "none",
        }}
      >
        <div className="flex min-w-0 items-center gap-2">
          {scrolled && tenant.logoImageId ? (
            <Image src={mediaFileUrl(tenant.logoImageId)} alt="" width={28} height={28} className="shrink-0 rounded-full object-cover" />
          ) : null}
          <span
            className="truncate font-[family-name:var(--sf-font-heading)] text-sm font-semibold transition-opacity duration-normal"
            style={{ color: scrolled ? "var(--sf-text)" : "transparent", opacity: scrolled ? 1 : 0 }}
          >
            {tenant.name}
          </span>
        </div>
        <button
          type="button"
          onClick={onSearchClick}
          aria-label="Menüde ara"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors duration-fast"
          style={{
            backgroundColor: scrolled ? "var(--sf-background)" : "rgba(255,255,255,0.15)",
            color: scrolled ? "var(--sf-text)" : "#FFFFFF",
            backdropFilter: scrolled ? undefined : "blur(8px)",
          }}
        >
          <Search className="h-4 w-4" />
        </button>
      </header>
    </>
  );
}
