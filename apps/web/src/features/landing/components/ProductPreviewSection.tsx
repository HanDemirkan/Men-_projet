"use client";

import { Badge } from "@qr-platform/ui";
import { motion } from "framer-motion";

import { fadeInUp } from "@/config/motion";

export function ProductPreviewSection() {
  return (
    <section className="container py-20">
      <motion.div {...fadeInUp} className="mx-auto max-w-5xl">
        <div className="mx-auto mb-10 flex max-w-2xl flex-col items-center gap-3 text-center">
          <Badge variant="secondary">Ürün Önizleme</Badge>
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Tek panelden tüm operasyon
          </h2>
          <p className="text-muted-foreground">
            Süper admin, işletme, garson, kasa ve mutfak için ayrı ayrı tasarlanmış, sade paneller.
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-md">
          <div className="flex items-center gap-1.5 border-b border-border bg-muted/50 px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
            <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
          </div>
          <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-4">
            <div className="hidden flex-col gap-2 sm:flex">
              <div className="h-7 rounded bg-primary/15" />
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-4 rounded bg-muted" />
              ))}
            </div>
            <div className="col-span-3 flex flex-col gap-4">
              <div className="grid grid-cols-3 gap-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-16 rounded-lg bg-muted" />
                ))}
              </div>
              <div className="h-40 rounded-lg bg-gradient-to-br from-primary/10 via-muted to-muted" />
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
