import type { StorefrontFooterProps } from "./types";

// Spec §7's "Footer Yapısı: Minimal" - just the custom footer text, if any;
// no copyright line, no socials (those already live in the social info-block,
// see primitives/info-blocks/SocialBlock.tsx).
export function MinimalFooter({ config }: StorefrontFooterProps) {
  if (!config.footerText) {
    return null;
  }

  return (
    <footer className="mt-auto px-5 py-4 text-center text-xs" style={{ color: "var(--sf-muted-text)" }}>
      {config.footerText}
    </footer>
  );
}
