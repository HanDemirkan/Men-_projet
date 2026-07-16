import { Logo } from "@qr-platform/ui";

import { SITE } from "@/config/site";

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="container flex flex-col gap-10 py-12 sm:flex-row sm:justify-between">
        <div className="flex flex-col gap-3">
          <Logo size="sm" />
          <p className="max-w-xs text-sm text-muted-foreground">{SITE.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-10 sm:gap-16">
          <div className="flex flex-col gap-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Ürün
            </p>
            <ul className="flex flex-col gap-2">
              {SITE.footerLinks.product.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Şirket
            </p>
            <ul className="flex flex-col gap-2">
              {SITE.footerLinks.company.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-border py-6">
        <p className="container text-xs text-muted-foreground">
          © {new Date().getFullYear()} QR Platform. Tüm hakları saklıdır.
        </p>
      </div>
    </footer>
  );
}
