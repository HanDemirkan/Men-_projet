import type { QrErrorCorrectionLevel } from "@qr-platform/shared";

import { getApiUrl } from "@/lib/env";

export interface QrOptions {
  format: "png" | "svg";
  errorCorrectionLevel: QrErrorCorrectionLevel;
  includeLogo: boolean;
}

// Cookie-authenticated GET, not JSON - a plain URL works here (both for an
// <img src> live preview and an <a href download> button) since the
// access_token cookie is SameSite=Lax and web/api share the same site
// (differ only by port in dev, by subdomain in production) - the same
// cross-origin-cookie behavior every other apiFetch call already relies on.
export function qrCodeUrl(options: QrOptions, download: boolean): string {
  const params = new URLSearchParams({
    format: options.format,
    errorCorrectionLevel: options.errorCorrectionLevel,
    includeLogo: String(options.includeLogo),
    ...(download ? { download: "true" } : {}),
  });
  return `${getApiUrl()}/qr-code?${params.toString()}`;
}
