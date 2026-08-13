"use client";

import type { StorefrontLayout, StorefrontSections } from "@qr-platform/shared";

import { INFO_BLOCK_REGISTRY } from "../primitives/info-blocks";

import type { PublicTenant } from "@/types/storefront";

export interface InfoBlockListProps {
  tenant: PublicTenant;
  layout: StorefrontLayout;
  sections: StorefrontSections;
}

// Renders every enabled block from INFO_BLOCK_REGISTRY, in registry order -
// this is the one place that knows the registry exists; adding a future
// block (see Sprint 7 architecture rule §8) never touches this component.
export function InfoBlockList({ tenant, layout, sections }: InfoBlockListProps) {
  const props = { tenant, layout, sections };
  const enabledBlocks = INFO_BLOCK_REGISTRY.filter((block) => block.isEnabled(props));

  if (enabledBlocks.length === 0) {
    return null;
  }

  return (
    // Sprint 8 redesign item 11: one real "About the restaurant" section of
    // the page - a heading + a divider setting it apart from the menu above
    // - not a loose stack of independent boxes that each look like a
    // settings-panel widget.
    <section className="flex flex-col gap-5 px-5 pb-6 pt-8" style={{ borderTop: "1px solid var(--sf-border)" }}>
      <h2 className="font-[family-name:var(--sf-font-heading)] text-lg font-semibold" style={{ color: "var(--sf-text)" }}>
        İşletme Hakkında
      </h2>
      <div className="flex flex-col gap-6">
        {enabledBlocks.map((block) => (
          <block.Component key={block.code} {...props} />
        ))}
      </div>
    </section>
  );
}
