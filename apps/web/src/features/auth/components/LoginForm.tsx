"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Checkbox, FieldError, Input, Label, PasswordInput, toast } from "@qr-platform/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { ROLE_REDIRECT } from "@/config/role-redirect";
import { ROUTES } from "@/config/routes";
import { getDevAdminCredentials } from "@/lib/env";
import { login } from "@/services/auth.service";

// The `process.env.NODE_ENV === "development"` comparison must be written
// inline (not hidden behind a function call in another module) so Next's
// production build can constant-fold and fully dead-code-eliminate this -
// label text and all - out of the client bundle. Verified by grepping a real
// `next build` output; a call routed only through getDevAdminCredentials()'s
// own internal check was NOT eliminated (the string literal still shipped,
// even though it could never render).
const devAdminCredentials = process.env.NODE_ENV === "development" ? getDevAdminCredentials() : null;

const loginSchema = z.object({
  email: z.string().min(1, "E-posta adresi zorunludur").email("Geçerli bir e-posta adresi girin"),
  password: z.string().min(8, "Şifre en az 8 karakter olmalıdır"),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: devAdminCredentials?.email ?? "",
      password: devAdminCredentials?.password ?? "",
      rememberMe: false,
    },
  });

  const onSubmit = async (values: LoginFormValues): Promise<void> => {
    const result = await login({ email: values.email, password: values.password });

    if (result.status === "error") {
      // Stable id: repeated failed attempts (e.g. mistyped password retried
      // several times) update the same toast in place instead of stacking.
      toast({ id: "auth-error", title: "Giriş başarısız", description: result.message, variant: "destructive" });
      return;
    }

    router.push(ROLE_REDIRECT[result.data.role]);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        {/* The real page title - AuthLayout's brand-panel headline is
            decorative marketing copy (also hidden below `lg:`), so this is
            the only heading a screen reader or the page's own outline ever
            sees regardless of viewport. */}
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">Giriş Yap</h1>
        <p className="text-sm text-muted-foreground">
          Hesabınıza erişmek için bilgilerinizi girin.
        </p>
        {devAdminCredentials ? (
          <p className="w-fit rounded-md bg-amber-100 px-2 py-1 text-xs font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-200">
            Yerel geliştirme hesabı
          </p>
        ) : null}
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
        <FieldError id="email-error">{errors.email?.message}</FieldError>
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
        <FieldError id="password-error">{errors.password?.message}</FieldError>
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
