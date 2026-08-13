"use client";

import { Button } from "@qr-platform/ui";
import { motion } from "framer-motion";
import Link from "next/link";

import { fadeInUp } from "@/config/motion";
import { ROUTES } from "@/config/routes";

// The one explicit "start now" moment on the page - deliberately placed
// after WhyChoose/FAQ (once the visitor has enough context to act), before
// the footer.
export function CtaSection() {
  return (
    <section className="container py-20">
      <motion.div
        {...fadeInUp}
        className="mx-auto flex max-w-3xl flex-col items-center gap-6 rounded-2xl border border-border bg-muted/40 px-6 py-14 text-center sm:px-16"
      >
        <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          İşletmenizi dijitalleştirmeye hazır mısınız?
        </h2>
        <p className="max-w-xl text-muted-foreground">
          Hesabınız varsa panelinize giriş yapın; menünüzü oluşturun, QR kodunuzu paylaşın,
          operasyonunuzu tek yerden yönetin.
        </p>
        <Button size="lg" asChild>
          <Link href={ROUTES.login}>Panele Giriş Yap</Link>
        </Button>
      </motion.div>
    </section>
  );
}
