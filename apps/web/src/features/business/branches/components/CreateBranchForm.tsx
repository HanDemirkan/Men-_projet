"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, Label, toast } from "@qr-platform/ui";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { ROUTES } from "@/config/routes";
import { createBranch } from "@/services/business-branches.service";

const createBranchSchema = z.object({
  name: z.string().min(1, "Şube adı zorunludur").max(255),
  phone: z.string().max(50).optional().or(z.literal("")),
  email: z.string().email("Geçerli bir e-posta girin").optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  googleMapsLink: z.string().optional().or(z.literal("")),
});

type CreateBranchFormValues = z.infer<typeof createBranchSchema>;

export function CreateBranchForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateBranchFormValues>({
    resolver: zodResolver(createBranchSchema),
    defaultValues: { name: "", phone: "", email: "", address: "", googleMapsLink: "" },
  });

  const onSubmit = async (values: CreateBranchFormValues): Promise<void> => {
    const result = await createBranch({
      name: values.name,
      phone: values.phone || undefined,
      email: values.email || undefined,
      address: values.address || undefined,
      googleMapsLink: values.googleMapsLink || undefined,
    });

    if (result.status === "error") {
      toast({ title: "Şube oluşturulamadı", description: result.message, variant: "destructive" });
      return;
    }

    toast({ title: "Şube oluşturuldu", variant: "success" });
    router.push(`${ROUTES.businessBranches}/${result.data.id}`);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex max-w-2xl flex-col gap-4 rounded-lg border border-border p-4">
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

      <Button type="submit" size="lg" isLoading={isSubmitting} className="w-fit">
        Şubeyi Oluştur
      </Button>
    </form>
  );
}
