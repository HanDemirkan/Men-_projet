"use client";

import { motion } from "framer-motion";
import { Layers, ShieldCheck, Sparkles, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { staggerChildren, staggerItem } from "@/config/motion";

interface Reason {
  icon: LucideIcon;
  title: string;
  description: string;
}

const REASONS: Reason[] = [
  {
    icon: Layers,
    title: "Tek Platform",
    description: "Menü, sipariş, kasa ve raporlama için ayrı araçlar yönetmeyin.",
  },
  {
    icon: Zap,
    title: "Gerçek Zamanlı",
    description: "Sipariş ve durum değişiklikleri tüm ekranlara anında yansır.",
  },
  {
    icon: ShieldCheck,
    title: "İzole Veri",
    description: "Her işletmenin verisi diğerlerinden tamamen ayrı tutulur.",
  },
  {
    icon: Sparkles,
    title: "Sade Arayüz",
    description: "Her rol yalnızca kendi işini yapmak için gerekeni görür.",
  },
];

export function WhyChooseSection() {
  return (
    <section id="why-choose" className="bg-muted/40 py-20">
      <div className="container">
        <div className="mx-auto mb-12 flex max-w-2xl flex-col items-center gap-3 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Neden Biz
          </h2>
        </div>

        <motion.div
          {...staggerChildren()}
          className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4"
        >
          {REASONS.map((reason) => (
            <motion.div
              key={reason.title}
              variants={staggerItem}
              className="group flex flex-col items-center gap-3 text-center"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background shadow-xs transition-[transform,box-shadow] duration-normal ease-standard group-hover:-translate-y-0.5 group-hover:shadow-sm">
                <reason.icon className="h-5 w-5 text-primary" aria-hidden="true" />
              </div>
              <h3 className="text-base font-semibold text-foreground">{reason.title}</h3>
              <p className="text-sm text-muted-foreground">{reason.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
