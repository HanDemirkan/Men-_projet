"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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

import { createCategory, updateCategory } from "@/services/category.service";
import { mediaFileUrl, uploadMedia } from "@/services/media.service";
import type { Category } from "@/types/catalog";

const categorySchema = z.object({
  name: z.string().min(1, "Kategori adı zorunludur").max(255),
  slug: z.string().optional(),
  description: z.string().optional(),
  active: z.boolean().optional(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

export interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menuId: string;
  category?: Category;
  onSaved: (category: Category) => void;
}

export function CategoryFormDialog({
  open,
  onOpenChange,
  menuId,
  category,
  onSaved,
}: CategoryFormDialogProps) {
  const [imageId, setImageId] = useState<string | null>(category?.imageId ?? null);
  const [isUploading, setIsUploading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    values: {
      name: category?.name ?? "",
      slug: category?.slug ?? "",
      description: category?.description ?? "",
      active: category?.active ?? true,
    },
  });

  const handleImageSelected = async (file: File): Promise<void> => {
    setIsUploading(true);
    const result = await uploadMedia(file, "CATEGORY");
    setIsUploading(false);

    if (result.status === "error") {
      toast({ title: "Görsel yüklenemedi", description: result.message, variant: "destructive" });
      return;
    }

    setImageId(result.data.id);
  };

  const onSubmit = async (values: CategoryFormValues): Promise<void> => {
    const input = { ...values, slug: values.slug || undefined, imageId: imageId ?? undefined };
    const result = category
      ? await updateCategory(category.id, input)
      : await createCategory(menuId, input);

    if (result.status === "error") {
      toast({ title: "Kaydedilemedi", description: result.message, variant: "destructive" });
      return;
    }

    toast({ title: category ? "Kategori güncellendi" : "Kategori oluşturuldu", variant: "success" });
    onSaved(result.data);
    onOpenChange(false);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? "Kategoriyi Düzenle" : "Yeni Kategori"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Görsel</Label>
            <Dropzone
              onFileSelected={(file) => void handleImageSelected(file)}
              isUploading={isUploading}
              previewUrl={imageId ? mediaFileUrl(imageId) : null}
              label="Kategori görseli yükle"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="category-name">Kategori Adı</Label>
            <Input
              id="category-name"
              {...register("name")}
              aria-invalid={errors.name ? true : undefined}
            />
            {errors.name ? (
              <p role="alert" className="text-sm text-destructive">
                {errors.name.message}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="category-slug">Slug (boş bırakılırsa otomatik)</Label>
            <Input id="category-slug" {...register("slug")} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="category-description">Açıklama</Label>
            <Textarea id="category-description" rows={3} {...register("description")} />
          </div>
          <div className="flex items-center gap-2">
            <Controller
              name="active"
              control={control}
              render={({ field }) => (
                <Switch id="category-active" checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
            <Label htmlFor="category-active" className="cursor-pointer font-normal">
              Aktif
            </Label>
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
