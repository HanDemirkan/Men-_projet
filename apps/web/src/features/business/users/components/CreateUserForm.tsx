"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ROLES } from "@qr-platform/permissions";
import type { Role } from "@qr-platform/permissions";
import { Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, toast } from "@qr-platform/ui";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { ROUTES } from "@/config/routes";
import { createBusinessUser } from "@/services/business-users.service";
import type { BusinessBranch } from "@/types/business";

const ROLE_LABELS: Record<string, string> = {
  TENANT_OWNER: "İşletme Sahibi",
  BRANCH_MANAGER: "Şube Müdürü",
  CASHIER: "Kasiyer",
  WAITER: "Garson",
  KITCHEN: "Mutfak",
  MENU_EDITOR: "Menü Editörü",
};

// Mirrors apps/api's user-management.policy.ts BRANCH_MANAGER_ASSIGNABLE_ROLES
// exactly - this is UI-layer show/hide only, the real enforcement is the
// backend policy. Keep both lists in sync if the backend list ever changes.
const BRANCH_MANAGER_ASSIGNABLE_ROLES: readonly Role[] = [ROLES.CASHIER, ROLES.WAITER, ROLES.KITCHEN, ROLES.MENU_EDITOR];

// Operational roles ordered before TENANT_OWNER/BRANCH_MANAGER on purpose -
// this list's first entry becomes the form's default selection, and a
// "create staff" form must never silently default to granting ownership.
const TENANT_OWNER_ASSIGNABLE_ROLES: readonly Role[] = [
  ROLES.WAITER,
  ROLES.CASHIER,
  ROLES.KITCHEN,
  ROLES.MENU_EDITOR,
  ROLES.BRANCH_MANAGER,
  ROLES.TENANT_OWNER,
];

const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).+$/;

function buildCreateUserSchema(assignableRoles: readonly Role[]) {
  return z.object({
    firstName: z.string().min(1, "Zorunlu").max(255),
    lastName: z.string().min(1, "Zorunlu").max(255),
    email: z.string().min(1, "Zorunlu").email("Geçerli bir e-posta girin"),
    password: z
      .string()
      .min(8, "Şifre en az 8 karakter olmalıdır")
      .regex(PASSWORD_PATTERN, "Şifre en az bir harf ve bir rakam içermelidir"),
    role: z.enum(assignableRoles as [Role, ...Role[]]),
    branchId: z.string().optional().or(z.literal("")),
  });
}

export interface CreateUserFormProps {
  branches: BusinessBranch[];
  callerRole: Role;
  callerBranchId: string | null;
}

export function CreateUserForm({ branches, callerRole, callerBranchId }: CreateUserFormProps) {
  const router = useRouter();
  const isBranchManager = callerRole === ROLES.BRANCH_MANAGER;
  const assignableRoles = isBranchManager ? BRANCH_MANAGER_ASSIGNABLE_ROLES : TENANT_OWNER_ASSIGNABLE_ROLES;
  const createUserSchema = buildCreateUserSchema(assignableRoles);
  type CreateUserFormValues = z.infer<typeof createUserSchema>;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      role: assignableRoles[0],
      branchId: isBranchManager ? (callerBranchId ?? "") : "",
    },
  });

  const onSubmit = async (values: CreateUserFormValues): Promise<void> => {
    const branchId = isBranchManager ? (callerBranchId ?? undefined) : values.branchId || undefined;

    const result = await createBusinessUser({
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      password: values.password,
      role: values.role,
      branchId,
    });

    if (result.status === "error") {
      toast({ title: "Personel oluşturulamadı", description: result.message, variant: "destructive" });
      return;
    }

    toast({ title: "Personel oluşturuldu", variant: "success" });
    router.push(`${ROUTES.businessUsers}/${result.data.membership.id}`);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex max-w-2xl flex-col gap-4 rounded-lg border border-border p-4">
      <p className="text-xs text-muted-foreground">
        Girilen e-posta zaten bir kullanıcıya aitse, şifre yok sayılır ve mevcut hesap işletmenize personel olarak
        eklenir - mevcut şifresi değiştirilmez.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="user-first-name">Ad</Label>
          <Input id="user-first-name" {...register("firstName")} aria-invalid={errors.firstName ? true : undefined} />
          {errors.firstName ? <p className="text-sm text-destructive">{errors.firstName.message}</p> : null}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="user-last-name">Soyad</Label>
          <Input id="user-last-name" {...register("lastName")} aria-invalid={errors.lastName ? true : undefined} />
          {errors.lastName ? <p className="text-sm text-destructive">{errors.lastName.message}</p> : null}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="user-email">E-posta</Label>
        <Input id="user-email" type="email" {...register("email")} aria-invalid={errors.email ? true : undefined} />
        {errors.email ? <p className="text-sm text-destructive">{errors.email.message}</p> : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="user-password">Geçici Şifre</Label>
        <Input id="user-password" type="password" {...register("password")} aria-invalid={errors.password ? true : undefined} />
        {errors.password ? <p className="text-sm text-destructive">{errors.password.message}</p> : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label>Rol</Label>
        <Controller
          name="role"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {assignableRoles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {ROLE_LABELS[role] ?? role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      {isBranchManager ? (
        <div className="flex flex-col gap-2">
          <Label>Şube</Label>
          <p className="text-sm text-muted-foreground">
            {branches.find((b) => b.id === callerBranchId)?.name ?? "Kendi şubeniz"} (yalnızca kendi şubenize personel ekleyebilirsiniz)
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <Label>Şube</Label>
          <Controller
            name="branchId"
            control={control}
            render={({ field }) => (
              <Select value={field.value || "NONE"} onValueChange={(value) => field.onChange(value === "NONE" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Şube seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">İşletme Geneli (şubesiz)</SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      )}

      <Button type="submit" size="lg" isLoading={isSubmitting} className="w-fit">
        Personeli Oluştur
      </Button>
    </form>
  );
}
