"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Badge,
  Button,
  Card,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  toast,
} from "@qr-platform/ui";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { updateBusinessSettings } from "@/services/business-settings.service";
import type { BusinessSettings } from "@/types/business";

const settingsSchema = z.object({
  timezone: z.string().min(1, "Zorunlu").max(100),
  dateFormat: z.string().min(1, "Zorunlu").max(20),
  priceDisplayFormat: z.enum(["WITH_CURRENCY", "NUMBER_ONLY"]),
  qrErrorCorrectionLevel: z.enum(["L", "M", "Q", "H"]),
  qrIncludeLogo: z.boolean(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

const DATE_FORMAT_OPTIONS = ["DD.MM.YYYY", "MM/DD/YYYY", "YYYY-MM-DD"];

export interface BusinessSettingsFormProps {
  settings: BusinessSettings;
  canUpdate: boolean;
}

export function BusinessSettingsForm({ settings, canUpdate }: BusinessSettingsFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    values: {
      timezone: settings.timezone,
      dateFormat: settings.dateFormat,
      priceDisplayFormat: settings.priceDisplayFormat,
      qrErrorCorrectionLevel: settings.qrDefaults.errorCorrectionLevel,
      qrIncludeLogo: settings.qrDefaults.includeLogo,
    },
  });

  const onSubmit = async (values: SettingsFormValues): Promise<void> => {
    const result = await updateBusinessSettings({
      timezone: values.timezone,
      dateFormat: values.dateFormat,
      priceDisplayFormat: values.priceDisplayFormat,
      qrDefaults: { errorCorrectionLevel: values.qrErrorCorrectionLevel, includeLogo: values.qrIncludeLogo },
    });

    if (result.status === "error") {
      toast({ title: "Ayarlar kaydedilemedi", description: result.message, variant: "destructive" });
      return;
    }

    toast({ title: "Ayarlar güncellendi", variant: "success" });
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <h3 className="text-sm font-semibold text-foreground">İşletme Bilgisi</h3>
        <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs font-medium uppercase text-muted-foreground">Dil</dt>
            <dd className="text-sm text-foreground">{settings.language}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-muted-foreground">Para Birimi</dt>
            <dd className="text-sm text-foreground">{settings.currency}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-muted-foreground">İşletme Durumu</dt>
            <dd>
              <Badge variant={settings.tenantStatus === "ACTIVE" ? "success" : "secondary"}>
                {settings.tenantStatus === "ACTIVE" ? "Aktif" : "Pasif"}
              </Badge>
            </dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-muted-foreground">
          Dil ve para birimi İşletme Profili ekranından değiştirilebilir. İşletme durumu yalnızca bilgi amaçlıdır.
        </p>
      </Card>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex max-w-2xl flex-col gap-4">
          <fieldset disabled={!canUpdate} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="settings-timezone">Saat Dilimi</Label>
                <Input id="settings-timezone" placeholder="Europe/Istanbul" {...register("timezone")} aria-invalid={errors.timezone ? true : undefined} />
                {errors.timezone ? <p className="text-sm text-destructive">{errors.timezone.message}</p> : null}
              </div>

              <div className="flex flex-col gap-2">
                <Label>Tarih Formatı</Label>
                <Controller
                  name="dateFormat"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DATE_FORMAT_OPTIONS.map((format) => (
                          <SelectItem key={format} value={format}>
                            {format}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Fiyat Gösterim Formatı</Label>
              <Controller
                name="priceDisplayFormat"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WITH_CURRENCY">Para birimiyle (₺120)</SelectItem>
                      <SelectItem value="NUMBER_ONLY">Yalnızca sayı (120)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <fieldset className="flex flex-col gap-4 rounded-lg border border-border p-4">
              <legend className="px-1 text-sm font-semibold text-foreground">QR Kod Varsayılanları</legend>

              <div className="flex flex-col gap-2">
                <Label>Hata Düzeltme Seviyesi</Label>
                <Controller
                  name="qrErrorCorrectionLevel"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full sm:w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="L">Düşük (L)</SelectItem>
                        <SelectItem value="M">Orta (M)</SelectItem>
                        <SelectItem value="Q">Yüksek (Q)</SelectItem>
                        <SelectItem value="H">En Yüksek (H)</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="qr-include-logo">QR koduna logo ekle</Label>
                <Controller
                  name="qrIncludeLogo"
                  control={control}
                  render={({ field }) => <Switch id="qr-include-logo" checked={field.value} onCheckedChange={field.onChange} />}
                />
              </div>
            </fieldset>

            {canUpdate ? (
              <Button type="submit" isLoading={isSubmitting} disabled={!isDirty} className="w-fit">
                Ayarları Kaydet
              </Button>
            ) : null}
          </fieldset>
        </form>
      </Card>
    </div>
  );
}
