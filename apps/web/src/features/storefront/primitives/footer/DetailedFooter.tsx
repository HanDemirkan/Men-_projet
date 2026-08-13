import type { StorefrontFooterProps } from "./types";

// Spec §7's "Footer Yapısı: Detaylı" - custom text + brand name + copyright
// year, a fuller sign-off for templates that want a more finished feel
// (premium-restaurant/modern-cafe's default).
export function DetailedFooter({ tenant, config }: StorefrontFooterProps) {
  return (
    <footer
      className="mt-auto flex flex-col items-center gap-1 px-5 py-6 text-center text-xs"
      style={{ color: "var(--sf-muted-text)", borderTop: "1px solid var(--sf-border)" }}
    >
      {config.footerText ? <p>{config.footerText}</p> : null}
      <p>
        © {new Date().getFullYear()} {tenant.name}
      </p>
    </footer>
  );
}
