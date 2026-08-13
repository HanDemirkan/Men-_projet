"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dropzone,
  Input,
  Label,
  Textarea,
  toast,
} from "@qr-platform/ui";
import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { MobilePreview } from "./MobilePreview";

import { WorkingHoursEditor } from "@/features/storefront/components/WorkingHoursEditor";
import type { WorkingHours } from "@/features/storefront/lib/working-hours";
import { updateBusinessProfile } from "@/services/business-profile.service";
import { mediaFileUrl, uploadMedia } from "@/services/media.service";
import type { BusinessProfile } from "@/types/catalog";


const DAYS: Array<{ key: string; label: string }> = [
  { key: "monday", label: "Pazartesi" },
  { key: "tuesday", label: "Salı" },
  { key: "wednesday", label: "Çarşamba" },
  { key: "thursday", label: "Perşembe" },
  { key: "friday", label: "Cuma" },
  { key: "saturday", label: "Cumartesi" },
  { key: "sunday", label: "Pazar" },
];

const daySchema = z.object({
  closed: z.boolean().optional(),
  open: z.string().optional(),
  close: z.string().optional(),
});

const profileSchema = z.object({
  name: z.string().min(1, "İşletme adı zorunludur").max(255),
  slug: z
    .string()
    .min(1, "Slug zorunludur")
    .max(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug yalnızca küçük harf, rakam ve tire içerebilir"),
  about: z.string().optional(),
  tagline: z.string().max(160, "Slogan en fazla 160 karakter olabilir").optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.union([z.string().email("Geçerli bir e-posta girin"), z.literal("")]).optional(),
  address: z.string().optional(),
  googleMapsLink: z.string().optional(),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  website: z.string().optional(),
  currency: z.string().max(3).optional(),
  language: z.string().max(10).optional(),
  workingHours: z.record(z.string(), daySchema).optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

function toFormWorkingHours(raw: BusinessProfile["workingHours"]): ProfileFormValues["workingHours"] {
  const result: NonNullable<ProfileFormValues["workingHours"]> = {};
  for (const day of DAYS) {
    const existing = (raw?.[day.key] ?? {}) as { closed?: boolean; open?: string; close?: string };
    result[day.key] = {
      closed: existing.closed ?? false,
      open: existing.open ?? "09:00",
      close: existing.close ?? "22:00",
    };
  }
  return result;
}

export interface BusinessProfileFormProps {
  profile: BusinessProfile;
}

export function BusinessProfileForm({ profile }: BusinessProfileFormProps) {
  const router = useRouter();
  const [logoImageId, setLogoImageId] = useState<string | null>(profile.logoImageId);
  const [coverImageId, setCoverImageId] = useState<string | null>(profile.coverImageId);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: profile.name,
      slug: profile.slug,
      about: profile.about ?? "",
      tagline: profile.tagline ?? "",
      phone: profile.phone ?? "",
      whatsapp: profile.whatsapp ?? "",
      email: profile.email ?? "",
      address: profile.address ?? "",
      googleMapsLink: profile.googleMapsLink ?? "",
      instagram: profile.instagram ?? "",
      facebook: profile.facebook ?? "",
      website: profile.website ?? "",
      currency: profile.currency,
      language: profile.language,
      workingHours: toFormWorkingHours(profile.workingHours),
    },
  });

  // Image uploads happen immediately (outside the form's own dirty state),
  // so "unsaved changes" must account for them too, not just text fields.
  const hasUnsavedImageChanges = logoImageId !== profile.logoImageId || coverImageId !== profile.coverImageId;
  const hasUnsavedChanges = isDirty || hasUnsavedImageChanges;

  // Tab close/refresh - the one leave-path the App Router gives no other way
  // to intercept. In-app navigation is covered by the inline banner below,
  // which is always on-screen while there are unsaved changes.
  useEffect(() => {
    if (!hasUnsavedChanges) {
      return;
    }

    const handler = (event: BeforeUnloadEvent): void => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsavedChanges]);

  const watchedValues = watch();

  const handleLogoSelected = async (file: File): Promise<void> => {
    setIsUploadingLogo(true);
    const result = await uploadMedia(file, "LOGO");
    setIsUploadingLogo(false);

    if (result.status === "error") {
      toast({ title: "Logo yüklenemedi", description: result.message, variant: "destructive" });
      return;
    }

    setLogoImageId(result.data.id);
  };

  const handleCoverSelected = async (file: File): Promise<void> => {
    setIsUploadingCover(true);
    const result = await uploadMedia(file, "COVER");
    setIsUploadingCover(false);

    if (result.status === "error") {
      toast({ title: "Kapak görseli yüklenemedi", description: result.message, variant: "destructive" });
      return;
    }

    setCoverImageId(result.data.id);
  };

  const onSubmit = async (values: ProfileFormValues): Promise<void> => {
    const result = await updateBusinessProfile({
      ...values,
      email: values.email || undefined,
      logoImageId,
      coverImageId,
    });

    if (result.status === "error") {
      toast({ title: "Kaydedilemedi", description: result.message, variant: "destructive" });
      return;
    }

    toast({ title: "Kaydedildi", description: "İşletme profili güncellendi.", variant: "success" });
    reset(values);
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex min-w-0 flex-1 flex-col gap-6">
      {hasUnsavedChanges ? (
        <div className="flex items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="flex-1">Kaydedilmemiş değişiklikleriniz var. Sayfadan ayrılmadan önce kaydedin.</span>
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Görseller</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label>Logo</Label>
            <Dropzone
              onFileSelected={(file) => void handleLogoSelected(file)}
              isUploading={isUploadingLogo}
              previewUrl={logoImageId ? mediaFileUrl(logoImageId) : null}
              label="Logo yükle"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Kapak Görseli</Label>
            <Dropzone
              onFileSelected={(file) => void handleCoverSelected(file)}
              isUploading={isUploadingCover}
              previewUrl={coverImageId ? mediaFileUrl(coverImageId) : null}
              label="Kapak görseli yükle"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Genel Bilgiler</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">İşletme Adı</Label>
            <Input id="name" {...register("name")} aria-invalid={errors.name ? true : undefined} />
            {errors.name ? (
              <p role="alert" className="text-sm text-destructive">
                {errors.name.message}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" {...register("slug")} aria-invalid={errors.slug ? true : undefined} />
            {errors.slug ? (
              <p role="alert" className="text-sm text-destructive">
                {errors.slug.message}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="tagline">Slogan</Label>
            <Input id="tagline" placeholder="Örn. Şehrin en iyi kahvesi" {...register("tagline")} aria-invalid={errors.tagline ? true : undefined} />
            {errors.tagline ? (
              <p role="alert" className="text-sm text-destructive">
                {errors.tagline.message}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="about">Hakkında</Label>
            <Textarea id="about" rows={4} {...register("about")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>İletişim</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="phone">Telefon</Label>
            <Input id="phone" {...register("phone")} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Input id="whatsapp" {...register("whatsapp")} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">E-posta</Label>
            <Input id="email" type="email" {...register("email")} />
            {errors.email ? (
              <p role="alert" className="text-sm text-destructive">
                {errors.email.message}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="address">Adres</Label>
            <Input id="address" {...register("address")} />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="googleMapsLink">Google Maps Linki</Label>
            <Input id="googleMapsLink" {...register("googleMapsLink")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sosyal Medya</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="instagram">Instagram</Label>
            <Input id="instagram" {...register("instagram")} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="facebook">Facebook</Label>
            <Input id="facebook" {...register("facebook")} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="website">Web Sitesi</Label>
            <Input id="website" {...register("website")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Çalışma Saatleri</CardTitle>
        </CardHeader>
        <CardContent>
          <WorkingHoursEditor
            value={(watchedValues.workingHours ?? {}) as WorkingHours}
            onChange={(next) => setValue("workingHours", next, { shouldDirty: true })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ayarlar</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="currency">Para Birimi</Label>
            <Input id="currency" {...register("currency")} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="language">Dil</Label>
            <Input id="language" {...register("language")} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" size="lg" isLoading={isSubmitting} disabled={!hasUnsavedChanges}>
          Kaydet
        </Button>
      </div>
    </form>

      <MobilePreview
        values={{
          name: watchedValues.name,
          about: watchedValues.about,
          phone: watchedValues.phone,
          address: watchedValues.address,
          instagram: watchedValues.instagram,
          website: watchedValues.website,
        }}
        logoImageId={logoImageId}
        coverImageId={coverImageId}
      />
    </div>
  );
}
