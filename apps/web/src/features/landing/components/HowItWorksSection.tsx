"use client";

import { motion } from "framer-motion";

import { staggerChildren, staggerItem } from "@/config/motion";

const STEPS = [
  {
    step: "01",
    title: "Menünüzü Oluşturun",
    description: "Kategori ve ürünlerinizi panelden ekleyin.",
  },
  {
    step: "02",
    title: "QR Kodunuzu Paylaşın",
    description: "Masalara veya tanıtım materyallerine yerleştirin.",
  },
  {
    step: "03",
    title: "Siparişleri Yönetin",
    description: "Garson ve mutfak ekranları anlık olarak senkron çalışır.",
  },
  {
    step: "04",
    title: "Raporları İnceleyin",
    description: "Ciro, sipariş ve performans verilerini tek yerden takip edin.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-muted/40 py-20">
      <div className="container">
        <div className="mx-auto mb-12 flex max-w-2xl flex-col items-center gap-3 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Nasıl Çalışır
          </h2>
          <p className="text-muted-foreground">
            Dört adımda kurulum yapın, aynı gün kullanmaya başlayın.
          </p>
        </div>

        <motion.div
          {...staggerChildren()}
          className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4"
        >
          {STEPS.map((item) => (
            <motion.div key={item.step} variants={staggerItem} className="flex flex-col gap-3">
              <span className="text-sm font-semibold text-primary">{item.step}</span>
              <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
