import type { StorefrontConfig } from "@qr-platform/shared";

import type { PublicTenant } from "@/types/storefront";

export interface StorefrontFooterProps {
  tenant: PublicTenant;
  config: StorefrontConfig;
}
