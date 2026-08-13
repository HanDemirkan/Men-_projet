import { MapPin, MessageCircle, Phone } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { InfoBlockProps } from "./types";

export function isContactBlockEnabled({ sections, tenant }: InfoBlockProps): boolean {
  if (!sections.contact) {
    return false;
  }
  return Boolean(
    tenant.address || (sections.whatsapp && tenant.whatsapp) || (sections.phone && tenant.phone) || (sections.googleMaps && tenant.googleMapsLink),
  );
}

interface ContactRow {
  key: string;
  icon: LucideIcon;
  label: string;
  value: string;
  href: string;
  external?: boolean;
}

// Sprint 8 redesign: was a row of solid-colored pill buttons (form-control
// styling, not a website) - now a real "Contact & Location" list, icon in a
// tinted circle + label + value, the pattern a restaurant's own site would
// use. The address itself is real tenant data that had no block at all
// before this - QuickActions (top of page) covers the compact one-tap
// version; this is the fuller read further down the page.
export function ContactBlock({ tenant, sections }: InfoBlockProps) {
  const rows: ContactRow[] = [];

  if (tenant.address) {
    rows.push({
      key: "address",
      icon: MapPin,
      label: "Adres",
      value: tenant.address,
      href: tenant.googleMapsLink ?? `https://maps.google.com/?q=${encodeURIComponent(tenant.address)}`,
      external: true,
    });
  }
  if (sections.phone && tenant.phone) {
    rows.push({ key: "phone", icon: Phone, label: "Telefon", value: tenant.phone, href: `tel:${tenant.phone}` });
  }
  if (sections.whatsapp && tenant.whatsapp) {
    rows.push({
      key: "whatsapp",
      icon: MessageCircle,
      label: "WhatsApp",
      value: tenant.whatsapp,
      href: `https://wa.me/${tenant.whatsapp.replace(/\D/g, "")}`,
      external: true,
    });
  }

  if (rows.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      {rows.map((row) => (
        <a key={row.key} href={row.href} target={row.external ? "_blank" : undefined} rel={row.external ? "noreferrer" : undefined} className="flex items-start gap-3">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: "color-mix(in srgb, var(--sf-primary) 12%, transparent)", color: "var(--sf-primary)" }}
          >
            <row.icon className="h-4 w-4" />
          </span>
          <span className="flex flex-col pt-1">
            <span className="font-[family-name:var(--sf-font-body)] text-xs" style={{ color: "var(--sf-muted-text)" }}>
              {row.label}
            </span>
            <span className="font-[family-name:var(--sf-font-body)] text-sm font-medium" style={{ color: "var(--sf-text)" }}>
              {row.value}
            </span>
          </span>
        </a>
      ))}
    </div>
  );
}
