"use client";

import { Card, StatusBadge } from "@qr-platform/ui";

import { useHealthStatus } from "../../hooks/useHealthStatus";

const SERVICE_LABELS = {
  api: "API",
  database: "PostgreSQL",
  redis: "Redis",
} as const;

type ServiceKey = keyof typeof SERVICE_LABELS;

export function HealthStatusPanel() {
  const health = useHealthStatus();

  if (health.state === "loading") {
    return (
      <Card role="status" aria-live="polite">
        <p className="text-sm text-slate-500">Sistem durumu kontrol ediliyor...</p>
      </Card>
    );
  }

  if (health.state === "error") {
    return (
      <Card role="alert">
        <div className="flex items-center gap-2">
          <StatusBadge state="down" label="Bağlantı yok" />
          <p className="text-sm text-slate-600">{health.message}</p>
        </div>
      </Card>
    );
  }

  const { data } = health;

  return (
    <Card>
      <div className="flex flex-col gap-3">
        {(Object.keys(SERVICE_LABELS) as ServiceKey[]).map((service) => {
          const serviceState = data.services[service];
          return (
            <div key={service} className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">{SERVICE_LABELS[service]}</span>
              <StatusBadge
                state={serviceState === "up" ? "up" : "down"}
                label={serviceState === "up" ? "Çalışıyor" : "Kapalı"}
              />
            </div>
          );
        })}
        <p className="text-xs text-slate-400">
          Son güncelleme: {new Date(data.timestamp).toLocaleString("tr-TR")}
        </p>
      </div>
    </Card>
  );
}
