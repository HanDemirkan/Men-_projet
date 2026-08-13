import { EmptyState, PageHeader } from "@qr-platform/ui";
import { LifeBuoy } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Destek — Süper Admin — QR Platform",
};

export default function AdminSupportPage() {
  return (
    <>
      <PageHeader title="Destek Talepleri" subtitle="Platform genelinde destek talepleri." />
      <EmptyState
        icon={LifeBuoy}
        title="Destek modülü henüz etkin değil"
        description="Destek talebi oluşturma ve takip özelliği bu sürümde bulunmuyor."
      />
    </>
  );
}
