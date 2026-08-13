import { PageHeader } from "@qr-platform/ui";
import type { Metadata } from "next";

import { MediaLibrary } from "@/features/media/components/MediaLibrary";
import { serverFetch } from "@/lib/server-fetch";
import type { Media } from "@/types/catalog";

export const metadata: Metadata = {
  title: "Medya Kütüphanesi — QR Platform",
};

export default async function BusinessMediaPage() {
  const media = (await serverFetch<Media[]>("/media")) ?? [];

  return (
    <>
      <PageHeader
        title="Medya Kütüphanesi"
        subtitle="Logo, kapak, kategori ve ürün görsellerinizi buradan yönetin."
      />
      <MediaLibrary initialMedia={media} />
    </>
  );
}
