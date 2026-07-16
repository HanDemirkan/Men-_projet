"use client";

import { Button } from "@qr-platform/ui";
import { motion } from "framer-motion";
import Link from "next/link";

import { LaptopMockup } from "./LaptopMockup";
import { PhoneMockup } from "./PhoneMockup";

import { MOTION_DURATION, MOTION_EASE } from "@/config/motion";
import { ROUTES } from "@/config/routes";

export function HeroSection() {
  return (
    <section className="container flex flex-col items-center gap-16 py-20 lg:flex-row lg:gap-12 lg:py-28">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: MOTION_DURATION.slow, ease: MOTION_EASE.enter }}
        className="flex max-w-xl flex-col items-center gap-6 text-center lg:items-start lg:text-left"
      >
        <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          QR Menüden Fazlası
        </h1>
        <p className="text-lg text-muted-foreground">
          İşletmenizi tek platformdan yönetin: dijital menü, sipariş, kasa ve operasyonun tamamı tek
          panelde.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button size="lg" asChild>
            <a href="#features">Ürünü Keşfet</a>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href={ROUTES.login}>Giriş Yap</Link>
          </Button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: MOTION_DURATION.slow, ease: MOTION_EASE.enter, delay: 0.1 }}
        className="relative flex w-full max-w-lg items-center justify-center"
      >
        <LaptopMockup />
        <div className="absolute -bottom-8 -right-2 hidden sm:block">
          <PhoneMockup />
        </div>
      </motion.div>
    </section>
  );
}
