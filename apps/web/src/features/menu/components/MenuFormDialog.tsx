"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  toast,
} from "@qr-platform/ui";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { createMenu, updateMenu } from "@/services/menu.service";
import type { Menu } from "@/types/catalog";

const menuSchema = z.object({
  name: z.string().min(1, "Menü adı zorunludur").max(255),
  description: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]),
});

type MenuFormValues = z.infer<typeof menuSchema>;

export interface MenuFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menu?: Menu;
  onSaved: (menu: Menu) => void;
}

export function MenuFormDialog({ open, onOpenChange, menu, onSaved }: MenuFormDialogProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MenuFormValues>({
    resolver: zodResolver(menuSchema),
    values: {
      name: menu?.name ?? "",
      description: menu?.description ?? "",
      status: menu?.status ?? "DRAFT",
    },
  });

  const onSubmit = async (values: MenuFormValues): Promise<void> => {
    const result = menu ? await updateMenu(menu.id, values) : await createMenu(values);

    if (result.status === "error") {
      toast({ title: "Kaydedilemedi", description: result.message, variant: "destructive" });
      return;
    }

    toast({ title: menu ? "Menü güncellendi" : "Menü oluşturuldu", variant: "success" });
    onSaved(result.data);
    onOpenChange(false);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{menu ? "Menüyü Düzenle" : "Yeni Menü"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="menu-name">Menü Adı</Label>
            <Input id="menu-name" {...register("name")} aria-invalid={errors.name ? true : undefined} />
            {errors.name ? (
              <p role="alert" className="text-sm text-destructive">
                {errors.name.message}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="menu-description">Açıklama</Label>
            <Textarea id="menu-description" rows={3} {...register("description")} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Durum</Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Taslak</SelectItem>
                    <SelectItem value="PUBLISHED">Yayında</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
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
