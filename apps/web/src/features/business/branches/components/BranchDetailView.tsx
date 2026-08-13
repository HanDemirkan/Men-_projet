"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Badge, Button, Card, Input, Label, toast } from "@qr-platform/ui";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { updateBranch } from "@/services/business-branches.service";
import type { BusinessBranch } from "@/types/business";

const editBranchSchema = z.object({
  name: z.string().min(1, "Şube adı zorunludur").max(255),
  phone: z.string().max(50).optional().or(z.literal("")),
  email: z.string().email("Geçerli bir e-posta girin").optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  googleMapsLink: z.string().optional().or(z.literal("")),
});

type EditBranchFormValues = z.infer<typeof editBranchSchema>;

export interface BranchDetailViewProps {
  branch: BusinessBranch;
  canManageStatus: boolean;
}

export function BranchDetailView({ branch: initialBranch, canManageStatus }: BranchDetailViewProps) {
  const [branch, setBranch] = useState(initialBranch);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<EditBranchFormValues>({
    resolver: zodResolver(editBranchSchema),
    values: {
      name: branch.name,
      phone: branch.phone ?? "",
      email: branch.email ?? "",
      address: branch.address ?? "",
      googleMapsLink: branch.googleMapsLink ?? "",
    },
  });

  const nextStatus = branch.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

  const toggleStatus = async (): Promise<void> => {
    setIsTogglingStatus(true);
    const result = await updateBranch(branch.id, { status: nextStatus });
    setIsTogglingStatus(false);

    if (result.status === "error") {
      toast({ title: "Durum değiştirilemedi", description: result.message, variant: "destructive" });
      return;
    }

    setBranch(result.data);
    toast({
      title: nextStatus === "ACTIVE" ? "Şube aktif hale getirildi" : "Şube pasif hale getirildi",
      variant: "success",
    });
  };

  const onSubmit = async (values: EditBranchFormValues): Promise<void> => {
    const result = await updateBranch(branch.id, {
      name: values.name,
      phone: values.phone || undefined,
      email: values.email || undefined,
      address: values.address || undefined,
      googleMapsLink: values.googleMapsLink || undefined,
    });

    if (result.status === "error") {
      toast({ title: "Kaydedilemedi", description: result.message, variant: "destructive" });
      return;
    }

    setBranch(result.data);
    toast({ title: "Şube güncellendi", variant: "success" });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant={branch.status === "ACTIVE" ? "success" : "secondary"} className="text-sm">
          {branch.status === "ACTIVE" ? "Aktif" : "Pasif"}
        </Badge>
        <span className="text-sm text-muted-foreground">{branch._count.tenantUsers} kullanıcı</span>
        {canManageStatus ? (
          <Button variant="outline" size="sm" isLoading={isTogglingStatus} onClick={() => void toggleStatus()}>
            {nextStatus === "ACTIVE" ? "Aktif Yap" : "Pasif Yap"}
          </Button>
        ) : null}
      </div>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex max-w-2xl flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="branch-name">Şube Adı</Label>
            <Input id="branch-name" {...register("name")} aria-invalid={errors.name ? true : undefined} />
            {errors.name ? <p className="text-sm text-destructive">{errors.name.message}</p> : null}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="branch-phone">Telefon</Label>
              <Input id="branch-phone" {...register("phone")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="branch-email">E-posta</Label>
              <Input id="branch-email" type="email" {...register("email")} aria-invalid={errors.email ? true : undefined} />
              {errors.email ? <p className="text-sm text-destructive">{errors.email.message}</p> : null}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="branch-address">Adres</Label>
            <Input id="branch-address" {...register("address")} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="branch-maps">Google Maps Linki</Label>
            <Input id="branch-maps" {...register("googleMapsLink")} />
          </div>

          <Button type="submit" isLoading={isSubmitting} disabled={!isDirty} className="w-fit">
            Değişiklikleri Kaydet
          </Button>
        </form>
      </Card>
    </div>
  );
}
