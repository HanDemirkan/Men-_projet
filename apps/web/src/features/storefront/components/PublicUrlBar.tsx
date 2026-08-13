"use client";

import { Button } from "@qr-platform/ui";
import { Check, Copy, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";

export interface PublicUrlBarProps {
  tenantSlug: string;
}

// Its own component (not inline state in StorefrontBuilder) so the
// window.location.origin effect's re-render is scoped to this small bar,
// not the whole builder - StorefrontBuilder's re-render was racing
// Playwright's (and, in principle, a real user's) interaction with
// ThemeEditor's controlled color inputs right after mount.
export function PublicUrlBar({ tenantSlug }: PublicUrlBarProps) {
  const [copied, setCopied] = useState(false);
  // Filled after mount (not during the initial render) so the server-
  // rendered and first client-rendered markup match - window isn't
  // available during SSR. This is the *current page's* origin (whatever
  // the business owner is actually browsing from right now), not the QR
  // code's own fixed PUBLIC_APP_URL (a backend-only concern, see Sprint 6 §1).
  const [publicOrigin, setPublicOrigin] = useState<string | null>(null);

  useEffect(() => {
    setPublicOrigin(window.location.origin);
  }, []);

  const publicUrl = publicOrigin ? `${publicOrigin}/${tenantSlug}` : null;

  const copyPublicUrl = async (): Promise<void> => {
    if (!publicUrl) {
      return;
    }
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm">
      <span className="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground">
        {publicUrl ?? `${tenantSlug} (adres yükleniyor…)`}
      </span>
      <Button variant="ghost" size="sm" disabled={!publicUrl} onClick={() => void copyPublicUrl()}>
        {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
        {copied ? "Kopyalandı" : "Kopyala"}
      </Button>
      {publicUrl ? (
        <Button variant="ghost" size="sm" asChild>
          <a href={publicUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            Storefront'u Aç
          </a>
        </Button>
      ) : null}
    </div>
  );
}
