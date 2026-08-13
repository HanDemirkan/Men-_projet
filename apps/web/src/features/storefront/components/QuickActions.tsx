import { Instagram, MapPin, Phone } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { PublicTenant } from "@/types/storefront";

// WhatsApp isn't in lucide-react's icon set (it's a branded logo, not a
// generic glyph) - a small inline SVG instead of pulling in a whole brand-
// icon package for one glyph.
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.9-4.44 9.9-9.9 0-2.64-1.03-5.12-2.9-6.99A9.82 9.82 0 0 0 12.04 2Zm5.8 14.16c-.24.68-1.4 1.3-1.94 1.38-.5.08-1.12.11-1.8-.11a16 16 0 0 1-1.65-.61c-2.9-1.25-4.8-4.17-4.94-4.36-.14-.2-1.18-1.57-1.18-3s.75-2.13 1.02-2.42c.26-.29.58-.36.77-.36l.55.01c.18.01.42-.07.65.5.24.58.81 2 .88 2.15.07.14.12.31.02.5-.1.2-.15.32-.3.49-.14.17-.3.38-.43.51-.14.14-.29.29-.13.58.17.29.75 1.25 1.62 2.02 1.11.99 2.05 1.3 2.34 1.44.29.14.46.12.63-.08.17-.19.72-.85.92-1.14.19-.29.38-.24.65-.14.26.1 1.68.79 1.97.93.29.14.48.21.55.33.07.12.07.68-.17 1.36Z" />
    </svg>
  );
}

interface Action {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon | typeof WhatsAppIcon;
}

// "Mobil uygulama kalitesinde compact action sistemi" (Sprint 8) - a row of
// tinted icon chips, not full-width form buttons. Every entry is real data:
// no WiFi action, since the business record has no field to back one, and
// nothing here is shown unless the tenant actually has that contact channel
// set - never a row of dead/placeholder buttons.
export function QuickActions({ tenant }: { tenant: PublicTenant }) {
  const actions: Action[] = [];

  if (tenant.googleMapsLink) {
    actions.push({ key: "directions", label: "Yol Tarifi", href: tenant.googleMapsLink, icon: MapPin });
  }
  if (tenant.phone) {
    actions.push({ key: "call", label: "Ara", href: `tel:${tenant.phone}`, icon: Phone });
  }
  if (tenant.whatsapp) {
    actions.push({ key: "whatsapp", label: "WhatsApp", href: `https://wa.me/${tenant.whatsapp.replace(/\D/g, "")}`, icon: WhatsAppIcon });
  }
  if (tenant.instagram) {
    const handle = tenant.instagram.replace(/^@/, "");
    actions.push({ key: "instagram", label: "Instagram", href: `https://instagram.com/${handle}`, icon: Instagram });
  }

  if (actions.length === 0) {
    return null;
  }

  return (
    <div className="flex gap-2 overflow-x-auto px-3 py-3">
      {actions.map((action) => (
        <a
          key={action.key}
          href={action.href}
          target={action.key === "call" ? undefined : "_blank"}
          rel={action.key === "call" ? undefined : "noopener noreferrer"}
          className="flex shrink-0 flex-col items-center gap-1.5 rounded-2xl px-4 py-2.5 transition-transform duration-fast active:scale-95"
          style={{ backgroundColor: "var(--sf-surface)", border: "1px solid var(--sf-border)" }}
        >
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full"
            style={{ backgroundColor: "color-mix(in srgb, var(--sf-primary) 12%, transparent)", color: "var(--sf-primary)" }}
          >
            <action.icon className="h-4 w-4" />
          </span>
          <span className="font-[family-name:var(--sf-font-body)] text-[11px] font-medium" style={{ color: "var(--sf-text)" }}>
            {action.label}
          </span>
        </a>
      ))}
    </div>
  );
}
