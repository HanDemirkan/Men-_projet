import type { StorefrontLayout, StorefrontSections } from "@qr-platform/shared";

import type { PublicTenant } from "@/types/storefront";

export interface InfoBlockProps {
  tenant: PublicTenant;
  layout: StorefrontLayout;
  sections: StorefrontSections;
}
