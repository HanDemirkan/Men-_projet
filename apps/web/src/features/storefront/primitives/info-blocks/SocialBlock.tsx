import { Facebook, Globe, Instagram } from "lucide-react";

import type { InfoBlockProps } from "./types";

export function isSocialBlockEnabled({ sections, tenant }: InfoBlockProps): boolean {
  return sections.social && Boolean(tenant.instagram || tenant.facebook || tenant.website);
}

// Tinted circles matching ContactBlock's icon treatment, not bare glyphs
// floating in a row - one consistent "icon chip" language across the whole
// section instead of two different icon styles competing.
export function SocialBlock({ tenant }: InfoBlockProps) {
  const links = [
    tenant.instagram ? { key: "instagram", href: tenant.instagram, label: "Instagram", Icon: Instagram } : null,
    tenant.facebook ? { key: "facebook", href: tenant.facebook, label: "Facebook", Icon: Facebook } : null,
    tenant.website ? { key: "website", href: tenant.website, label: "Web sitesi", Icon: Globe } : null,
  ].filter((link): link is NonNullable<typeof link> => link !== null);

  return (
    <div className="flex gap-3">
      {links.map(({ key, href, label, Icon }) => (
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noreferrer"
          aria-label={label}
          className="flex h-9 w-9 items-center justify-center rounded-full transition-transform duration-fast active:scale-90"
          style={{ backgroundColor: "color-mix(in srgb, var(--sf-primary) 12%, transparent)", color: "var(--sf-primary)" }}
        >
          <Icon className="h-4 w-4" />
        </a>
      ))}
    </div>
  );
}
