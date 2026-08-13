import type { Metadata } from "next";

import { CtaSection } from "@/features/landing/components/CtaSection";
import { FaqSection } from "@/features/landing/components/FaqSection";
import { FeaturesSection } from "@/features/landing/components/FeaturesSection";
import { Footer } from "@/features/landing/components/Footer";
import { HeroSection } from "@/features/landing/components/HeroSection";
import { HowItWorksSection } from "@/features/landing/components/HowItWorksSection";
import { ProductPreviewSection } from "@/features/landing/components/ProductPreviewSection";
import { SiteHeader } from "@/features/landing/components/SiteHeader";
import { WhyChooseSection } from "@/features/landing/components/WhyChooseSection";

export const metadata: Metadata = {
  title: "QR Platform — QR Menüden Fazlası",
};

export default function LandingPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" tabIndex={-1}>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <ProductPreviewSection />
        <WhyChooseSection />
        <FaqSection />
        <CtaSection />
      </main>
      <Footer />
    </>
  );
}
