"use client";

import { Button, Drawer, DrawerContent, DrawerTrigger, Logo } from "@qr-platform/ui";
import { Menu } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { ROUTES } from "@/config/routes";
import { SITE } from "@/config/site";

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-16 items-center justify-between">
        <Link href={ROUTES.home}>
          <Logo size="sm" />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {SITE.nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Button variant="ghost" asChild>
            <Link href={ROUTES.login}>Giriş Yap</Link>
          </Button>
          <Button asChild>
            <a href="#features">Ürünü Keşfet</a>
          </Button>
        </div>

        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Menüyü aç">
              <Menu className="h-5 w-5" aria-hidden="true" />
            </Button>
          </DrawerTrigger>
          <DrawerContent side="right">
            <Logo size="sm" />
            <nav className="mt-4 flex flex-col gap-1">
              {SITE.nav.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                >
                  {item.label}
                </a>
              ))}
            </nav>
            <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
              <Button variant="outline" asChild>
                <Link href={ROUTES.login}>Giriş Yap</Link>
              </Button>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </header>
  );
}
