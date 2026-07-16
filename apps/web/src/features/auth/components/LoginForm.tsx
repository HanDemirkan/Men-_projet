"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Checkbox, Input, Label, PasswordInput, toast } from "@qr-platform/ui";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { ROUTES } from "@/config/routes";

const loginSchema = z.object({
  email: z.string().min(1, "E-posta adresi zorunludur").email("Geçerli bir e-posta adresi girin"),
  password: z.string().min(8, "Şifre en az 8 karakter olmalıdır"),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  const onSubmit = async (): Promise<void> => {
    // No backend in Sprint 1 - simulates a network round-trip so the
    // loading/disabled states are real and demonstrable.
    await new Promise((resolve) => setTimeout(resolve, 800));
    toast({
      title: "Önizleme modu",
      description: "Bu sürümde kimlik doğrulama henüz bağlı değil.",
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">Giriş Yap</h2>
        <p className="text-sm text-muted-foreground">
          Hesabınıza erişmek için bilgilerinizi girin.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">E-posta</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="ornek@isletme.com"
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? "email-error" : undefined}
          {...register("email")}
        />
        {errors.email ? (
          <p id="email-error" role="alert" className="text-sm text-destructive">
            {errors.email.message}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Şifre</Label>
          <Link
            href={ROUTES.forgotPassword}
            className="text-sm font-medium text-primary hover:underline"
          >
            Şifremi Unuttum
          </Link>
        </div>
        <PasswordInput
          id="password"
          autoComplete="current-password"
          aria-invalid={errors.password ? true : undefined}
          aria-describedby={errors.password ? "password-error" : undefined}
          {...register("password")}
        />
        {errors.password ? (
          <p id="password-error" role="alert" className="text-sm text-destructive">
            {errors.password.message}
          </p>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <Controller
          name="rememberMe"
          control={control}
          render={({ field }) => (
            <Checkbox id="rememberMe" checked={field.value} onCheckedChange={field.onChange} />
          )}
        />
        <Label htmlFor="rememberMe" className="cursor-pointer font-normal text-muted-foreground">
          Beni hatırla
        </Label>
      </div>

      <Button type="submit" size="lg" isLoading={isSubmitting} className="w-full">
        Giriş Yap
      </Button>
    </form>
  );
}
