"use client";

import {
  Button,
  Dropzone,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toast,
} from "@qr-platform/ui";
import { Loader2, Trash2 } from "lucide-react";
import { useRef, useState } from "react";

import { deleteMedia, mediaThumbnailUrl, uploadMedia } from "@/services/media.service";
import type { Media, MediaType } from "@/types/catalog";

const MEDIA_TYPE_LABELS: Record<MediaType, string> = {
  IMAGE: "Genel Görsel",
  LOGO: "Logo",
  COVER: "Kapak",
  PRODUCT: "Ürün",
  CATEGORY: "Kategori",
  QR: "QR",
};

export interface MediaLibraryProps {
  initialMedia: Media[];
}

export function MediaLibrary({ initialMedia }: MediaLibraryProps) {
  const [media, setMedia] = useState<Media[]>(initialMedia);
  const [uploadType, setUploadType] = useState<MediaType>("IMAGE");
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  // See CategoryList's own comment for why a ref, not just state.
  const isDeletingRef = useRef(false);

  const handleUpload = async (file: File): Promise<void> => {
    setIsUploading(true);
    const result = await uploadMedia(file, uploadType);
    setIsUploading(false);

    if (result.status === "error") {
      toast({ title: "Yükleme başarısız", description: result.message, variant: "destructive" });
      return;
    }

    setMedia((current) => [result.data, ...current]);
    toast({ title: "Yüklendi", description: "Görsel medya kütüphanesine eklendi.", variant: "success" });
  };

  const handleDelete = async (id: string): Promise<void> => {
    if (isDeletingRef.current) {
      return;
    }
    isDeletingRef.current = true;

    if (!window.confirm("Bu görseli silmek istediğinize emin misiniz?")) {
      isDeletingRef.current = false;
      return;
    }

    setDeletingId(id);
    const result = await deleteMedia(id);
    setDeletingId(null);
    isDeletingRef.current = false;

    if (result.status === "error") {
      toast({ title: "Silinemedi", description: result.message, variant: "destructive" });
      return;
    }

    setMedia((current) => current.filter((item) => item.id !== id));
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-lg border border-border p-4 sm:flex-row sm:items-end">
        <div className="flex w-full max-w-xs flex-col gap-2">
          <span className="text-sm font-medium text-foreground">Medya Türü</span>
          <Select value={uploadType} onValueChange={(value) => setUploadType(value as MediaType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(MEDIA_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <Dropzone onFileSelected={(file) => void handleUpload(file)} isUploading={isUploading} />
        </div>
      </div>

      {media.length === 0 ? (
        <p className="text-sm text-muted-foreground">Henüz yüklenmiş bir medya yok.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {media.map((item) => (
            <div key={item.id} className="group relative overflow-hidden rounded-lg border border-border">
              {/* Served by the API by opaque id, not a static/optimizable local asset. */}
              <img
                src={mediaThumbnailUrl(item.id)}
                alt={item.originalFilename}
                className="aspect-square w-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-background/90 p-2">
                <span className="truncate text-xs text-muted-foreground">
                  {MEDIA_TYPE_LABELS[item.type]}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive"
                  disabled={deletingId === item.id}
                  onClick={() => void handleDelete(item.id)}
                  aria-label="Sil"
                >
                  {deletingId === item.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
