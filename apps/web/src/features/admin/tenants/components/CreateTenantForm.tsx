"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toast,
} from "@qr-platform/ui";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { ROUTES } from "@/config/routes";
import { createTenant } from "@/services/admin-tenants.service";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).+$/;

const createTenantSchema = z.object({
  name: z.string().min(1, "İşletme adı zorunludur").max(255),
  slug: z
    .string()
    .max(255)
    .regex(SLUG_PATTERN, "Slug yalnızca küçük harf, rakam ve tire içerebilir.")
    .optional()
    .or(z.literal("")),
  ownerFirstName: z.string().min(1, "Zorunlu").max(255),
  ownerLastName: z.string().min(1, "Zorunlu").max(255),
  ownerEmail: z.string().min(1, "Zorunlu").email("Geçerli bir e-posta girin"),
  ownerPassword: z
    .string()
    .min(8, "Şifre en az 8 karakter olmalıdır")
    .regex(PASSWORD_PATTERN, "Şifre en az bir harf ve bir rakam içermelidir"),
  branchName: z.string().min(1, "Zorunlu").max(255),
  phone: z.string().max(50).optional().or(z.literal("")),
  status: z.enum(["ACTIVE", "SUSPENDED"]),
});

type CreateTenantFormValues = z.infer<typeof createTenantSchema>;

export function CreateTenantForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateTenantFormValues>({
    resolver: zodResolver(createTenantSchema),
    defaultValues: {
      name: "",
      slug: "",
      ownerFirstName: "",
      ownerLastName: "",
      ownerEmail: "",
      ownerPassword: "",
      branchName: "Merkez Şube",
      phone: "",
      status: "ACTIVE",
    },
  });

  const onSubmit = async (values: CreateTenantFormValues): Promise<void> => {
    const result = await createTenant({
      name: values.name,
      slug: values.slug || undefined,
      ownerFirstName: values.ownerFirstName,
      ownerLastName: values.ownerLastName,
      ownerEmail: values.ownerEmail,
      ownerPassword: values.ownerPassword,
      branchName: values.branchName,
      phone: values.phone || undefined,
      status: values.status,
    });

    if (result.status === "error") {
      toast({ title: "İşletme oluşturulamadı", description: result.message, variant: "destructive" });
      return;
    }

    toast({ title: "İşletme oluşturuldu", variant: "success" });
    router.push(`${ROUTES.adminTenants}/${result.data.tenant.id}`);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex max-w-2xl flex-col gap-6">
      <fieldset className="flex flex-col gap-4 rounded-lg border border-border p-4">
        <legend className="px-1 text-sm font-semibold text-foreground">İşletme</legend>

        <div className="flex flex-col gap-2">
          <Label htmlFor="tenant-name">İşletme Adı</Label>
          <Input id="tenant-name" {...register("name")} aria-invalid={errors.name ? true : undefined} />
          {errors.name ? <p className="text-sm text-destructive">{errors.name.message}</p> : null}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="tenant-slug">Slug</Label>
          <Input id="tenant-slug" placeholder="Boş bırakılırsa isimden üretilir" {...register("slug")} />
          {errors.slug ? <p className="text-sm text-destructive">{errors.slug.message}</p> : null}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="tenant-phone">Telefon</Label>
          <Input id="tenant-phone" {...register("phone")} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="tenant-branch">İlk Şube Adı</Label>
          <Input id="tenant-branch" {...register("branchName")} aria-invalid={errors.branchName ? true : undefined} />
          {errors.branchName ? <p className="text-sm text-destructive">{errors.branchName.message}</p> : null}
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
                  <SelectItem value="ACTIVE">Aktif</SelectItem>
                  <SelectItem value="SUSPENDED">Pasif</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4 rounded-lg border border-border p-4">
        <legend className="px-1 text-sm font-semibold text-foreground">İşletme Sahibi</legend>
        <p className="text-xs text-muted-foreground">
          Girilen e-posta zaten bir kullanıcıya aitse, şifre yok sayılır ve mevcut hesap bu işletmeye sahip olarak
          eklenir - mevcut şifresi değiştirilmez.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="owner-first-name">Ad</Label>
            <Input
              id="owner-first-name"
              {...register("ownerFirstName")}
              aria-invalid={errors.ownerFirstName ? true : undefined}
            />
            {errors.ownerFirstName ? (
              <p className="text-sm text-destructive">{errors.ownerFirstName.message}</p>
            ) : null}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="owner-last-name">Soyad</Label>
            <Input
              id="owner-last-name"
              {...register("ownerLastName")}
              aria-invalid={errors.ownerLastName ? true : undefined}
            />
            {errors.ownerLastName ? <p className="text-sm text-destructive">{errors.ownerLastName.message}</p> : null}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="owner-email">E-posta</Label>
          <Input
            id="owner-email"
            type="email"
            {...register("ownerEmail")}
            aria-invalid={errors.ownerEmail ? true : undefined}
          />
          {errors.ownerEmail ? <p className="text-sm text-destructive">{errors.ownerEmail.message}</p> : null}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="owner-password">Geçici Şifre</Label>
          <Input
            id="owner-password"
            type="password"
            {...register("ownerPassword")}
            aria-invalid={errors.ownerPassword ? true : undefined}
          />
          {errors.ownerPassword ? <p className="text-sm text-destructive">{errors.ownerPassword.message}</p> : null}
        </div>
      </fieldset>

      <Button type="submit" size="lg" isLoading={isSubmitting} className="w-fit">
        İşletmeyi Oluştur
      </Button>
    </form>
  );
}
