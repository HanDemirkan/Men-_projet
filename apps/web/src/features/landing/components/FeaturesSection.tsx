"use client";

import { Card, CardContent } from "@qr-platform/ui";
import { motion } from "framer-motion";
import { BarChart3, ChefHat, QrCode, Receipt, Store, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { staggerChildren, staggerItem } from "@/config/motion";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

const FEATURES: Feature[] = [
  {
    icon: QrCode,
    title: "Dijital Menü",
    description: "Mobil uyumlu, anında güncellenen QR menü ile baskı maliyetlerinden kurtulun.",
  },
  {
    icon: Receipt,
    title: "Sipariş Yönetimi",
    description: "Garson ve mutfak ekranları arasında siparişler gerçek zamanlı akar.",
  },
  {
    icon: BarChart3,
    title: "Kasa Takibi",
    description: "Adisyon, tahsilat ve gün sonu raporlarını tek ekrandan yönetin.",
  },
  {
    icon: ChefHat,
    title: "Mutfak Ekranı",
    description: "Mutfak yalnızca hazırlaması gereken siparişleri, önceliğine göre görür.",
  },
  {
    icon: Store,
    title: "Çoklu Şube",
    description: "Tek işletme hesabından birden fazla şubeyi merkezi olarak yönetin.",
  },
  {
    icon: Users,
    title: "Rol Bazlı Erişim",
    description: "Süper admin, işletme, garson, kasa ve mutfak için ayrı, sade paneller.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="container py-20">
      <div className="mx-auto mb-12 flex max-w-2xl flex-col items-center gap-3 text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Özellikler
        </h2>
        <p className="text-muted-foreground">
          İşletmenizin operasyonunu uçtan uca kapsayan, birbirine bağlı bir sistem.
        </p>
      </div>

      <motion.div
        {...staggerChildren()}
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        {FEATURES.map((feature) => (
          <motion.div key={feature.title} variants={staggerItem}>
            <Card className="h-full">
              <CardContent className="flex flex-col gap-4 p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <h3 className="text-base font-semibold text-foreground">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
