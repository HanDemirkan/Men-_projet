"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, Label } from "@qr-platform/ui";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { ROUTES } from "@/config/routes";

const forgotPasswordSchema = z.object({
  email: z.string().min(1, "E-posta adresi zorunludur").email("Geçerli bir e-posta adresi girin"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: ForgotPasswordFormValues): Promise<void> => {
    // No backend in Sprint 1 - simulates a network round-trip so the
    // loading state is real and demonstrable.
    await new Promise((resolve) => setTimeout(resolve, 800));
    setSubmittedEmail(values.email);
  };

  if (submittedEmail) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
          <CheckCircle2 className="h-6 w-6 text-success" aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            E-postanızı kontrol edin
          </h2>
          <p className="text-sm text-muted-foreground">
            <strong className="font-medium text-foreground">{submittedEmail}</strong> kayıtlıysa,
            şifre sıfırlama bağlantısı gönderildi.
          </p>
        </div>
        <Button variant="outline" asChild className="mt-2">
          <Link href={ROUTES.login}>Girişe dön</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">Şifremi Unuttum</h2>
        <p className="text-sm text-muted-foreground">
          Hesabınıza bağlı e-posta adresini girin, sıfırlama bağlantısı gönderelim.
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

      <Button type="submit" size="lg" isLoading={isSubmitting} className="w-full">
        Sıfırlama Bağlantısı Gönder
      </Button>

      <Link
        href={ROUTES.login}
        className="text-center text-sm font-medium text-primary hover:underline"
      >
        Girişe dön
      </Link>
    </form>
  );
}
