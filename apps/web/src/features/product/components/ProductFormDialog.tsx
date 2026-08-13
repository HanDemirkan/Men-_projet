"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PRODUCT_TAGS, PRODUCT_TAG_LABELS } from "@qr-platform/shared";
import type { ProductTag } from "@qr-platform/shared";
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Dropzone,
  Input,
  Label,
  Switch,
  Textarea,
  toast,
} from "@qr-platform/ui";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { mediaFileUrl, uploadMedia } from "@/services/media.service";
import { createProduct, updateProduct } from "@/services/product.service";
import type { Product } from "@/types/catalog";

const productSchema = z.object({
  name: z.string().min(1, "Ürün adı zorunludur").max(255),
  slug: z.string().optional(),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  price: z.coerce.number().positive("Fiyat 0'dan büyük olmalıdır"),
  preparationTime: z.coerce.number().int().min(0).optional(),
  calories: z.coerce.number().int().min(0).optional(),
  allergens: z.string().optional(),
  isAvailable: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

export interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId: string;
  product?: Product;
  onSaved: (product: Product) => void;
}

export function ProductFormDialog({
  open,
  onOpenChange,
  categoryId,
  product,
  onSaved,
}: ProductFormDialogProps) {
  const [imageId, setImageId] = useState<string | null>(product?.imageId ?? null);
  const [isUploading, setIsUploading] = useState(false);
  const [tags, setTags] = useState<ProductTag[]>(product?.tags ?? []);

  function toggleTag(tag: ProductTag): void {
    setTags((current) => (current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag]));
  }

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    values: {
      name: product?.name ?? "",
      slug: product?.slug ?? "",
      description: product?.description ?? "",
      shortDescription: product?.shortDescription ?? "",
      price: product ? Number(product.price) : 0,
      preparationTime: product?.preparationTime ?? undefined,
      calories: product?.calories ?? undefined,
      allergens: product?.allergens ?? "",
      isAvailable: product?.isAvailable ?? true,
      isFeatured: product?.isFeatured ?? false,
    },
  });

  const handleImageSelected = async (file: File): Promise<void> => {
    setIsUploading(true);
    const result = await uploadMedia(file, "PRODUCT");
    setIsUploading(false);

    if (result.status === "error") {
      toast({ title: "Görsel yüklenemedi", description: result.message, variant: "destructive" });
      return;
    }

    setImageId(result.data.id);
  };

  const onSubmit = async (values: ProductFormValues): Promise<void> => {
    const input = {
      ...values,
      slug: values.slug || undefined,
      imageId: imageId ?? undefined,
      tags,
    };
    const result = product ? await updateProduct(product.id, input) : await createProduct(categoryId, input);

    if (result.status === "error") {
      toast({ title: "Kaydedilemedi", description: result.message, variant: "destructive" });
      return;
    }

    toast({ title: product ? "Ürün güncellendi" : "Ürün oluşturuldu", variant: "success" });
    onSaved(result.data);
    onOpenChange(false);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? "Ürünü Düzenle" : "Yeni Ürün"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Görsel</Label>
            <Dropzone
              onFileSelected={(file) => void handleImageSelected(file)}
              isUploading={isUploading}
              previewUrl={imageId ? mediaFileUrl(imageId) : null}
              label="Ürün görseli yükle"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="product-name">Ürün Adı</Label>
              <Input id="product-name" {...register("name")} aria-invalid={errors.name ? true : undefined} />
              {errors.name ? (
                <p role="alert" className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              ) : null}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="product-slug">Slug (boş bırakılırsa otomatik)</Label>
              <Input id="product-slug" {...register("slug")} />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="product-short-description">Kısa Açıklama</Label>
            <Input id="product-short-description" {...register("shortDescription")} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="product-description">Açıklama</Label>
            <Textarea id="product-description" rows={3} {...register("description")} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="product-price">Fiyat</Label>
              <Input
                id="product-price"
                type="number"
                step="0.01"
                {...register("price")}
                aria-invalid={errors.price ? true : undefined}
              />
              {errors.price ? (
                <p role="alert" className="text-sm text-destructive">
                  {errors.price.message}
                </p>
              ) : null}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="product-prep-time">Hazırlık Süresi (dk)</Label>
              <Input id="product-prep-time" type="number" {...register("preparationTime")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="product-calories">Kalori</Label>
              <Input id="product-calories" type="number" {...register("calories")} />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="product-allergens">Alerjenler</Label>
            <Input id="product-allergens" placeholder="Örn. Gluten, süt ürünleri" {...register("allergens")} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Etiketler</Label>
            <div className="flex flex-wrap gap-2">
              {PRODUCT_TAGS.map((tag) => {
                const active = tags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleTag(tag)}
                    className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {PRODUCT_TAG_LABELS[tag]}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <Controller
                name="isAvailable"
                control={control}
                render={({ field }) => (
                  <Switch
                    id="product-available"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label htmlFor="product-available" className="cursor-pointer font-normal">
                Satışa Açık
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Controller
                name="isFeatured"
                control={control}
                render={({ field }) => (
                  <Switch id="product-featured" checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
              <Label htmlFor="product-featured" className="cursor-pointer font-normal">
                Öne Çıkan
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" isLoading={isSubmitting}>
              Kaydet
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
