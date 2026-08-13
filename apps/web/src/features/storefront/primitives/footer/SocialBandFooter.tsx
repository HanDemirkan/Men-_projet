import { Facebook, Globe, Instagram } from "lucide-react";

import type { StorefrontFooterProps } from "./types";

// Spec §7's "Footer Yapısı: Sosyal Medya Şeridi" - a highlighted band putting
// social links front and center. Not any of the 3 curated templates' default
// (Sprint 8), but stays selectable via the Layout step for tenants where
// social presence matters more than a plain copyright line.
export function SocialBandFooter({ tenant, config }: StorefrontFooterProps) {
  const hasSocial = tenant.instagram || tenant.facebook || tenant.website;

  return (
    <footer className="mt-auto flex flex-col items-center gap-3 px-5 py-6 text-center" style={{ backgroundColor: "var(--sf-surface)" }}>
      {hasSocial ? (
        <div className="flex gap-4" style={{ color: "var(--sf-text)" }}>
          {tenant.instagram ? (
            <a href={tenant.instagram} target="_blank" rel="noreferrer" aria-label="Instagram">
              <Instagram size={20} />
            </a>
          ) : null}
          {tenant.facebook ? (
            <a href={tenant.facebook} target="_blank" rel="noreferrer" aria-label="Facebook">
              <Facebook size={20} />
            </a>
          ) : null}
          {tenant.website ? (
            <a href={tenant.website} target="_blank" rel="noreferrer" aria-label="Web sitesi">
              <Globe size={20} />
            </a>
          ) : null}
        </div>
      ) : null}
      {config.footerText ? (
        <p className="text-xs" style={{ color: "var(--sf-muted-text)" }}>
          {config.footerText}
        </p>
      ) : null}
      <p className="text-xs" style={{ color: "var(--sf-muted-text)" }}>
        © {new Date().getFullYear()} {tenant.name}
      </p>
    </footer>
  );
}
