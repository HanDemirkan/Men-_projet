"use client";

import { Card, StatusBadge } from "@qr-platform/ui";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { AdminSystemInfo } from "@/types/admin";

const SERVICE_LABELS = { api: "API", database: "PostgreSQL", redis: "Redis", worker: "Worker" } as const;

function formatUptime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours}s ${minutes}d ${secs}sn`;
}

export interface SystemStatusViewProps {
  info: AdminSystemInfo;
}

export function SystemStatusView({ info }: SystemStatusViewProps) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = (): void => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={refresh}
        className="flex w-fit items-center gap-2 text-sm font-medium text-primary hover:underline disabled:opacity-50"
        disabled={isRefreshing}
      >
        <RefreshCw className={isRefreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"} aria-hidden="true" />
        Yenile
      </button>

      <Card>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Servis Durumu</h3>
        <div className="flex flex-col gap-3">
          {(Object.keys(SERVICE_LABELS) as Array<keyof typeof SERVICE_LABELS>).map((service) => (
            <div key={service} className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">{SERVICE_LABELS[service]}</span>
              <StatusBadge
                state={info.services[service] === "up" ? "up" : "down"}
                label={info.services[service] === "up" ? "Çalışıyor" : "Kapalı"}
              />
            </div>
          ))}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Storage</span>
            <StatusBadge state={info.storage.status === "up" ? "up" : "down"} label={info.storage.status === "up" ? "Erişilebilir" : "Erişilemiyor"} />
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Uygulama Bilgisi</h3>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase text-muted-foreground">Environment</dt>
            <dd className="text-sm text-foreground">{info.environment}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-muted-foreground">Versiyon</dt>
            <dd className="text-sm text-foreground">{info.version}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-muted-foreground">Uptime</dt>
            <dd className="text-sm text-foreground">{formatUptime(info.uptimeSeconds)}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs font-medium uppercase text-muted-foreground">Son Migration</dt>
            {/* break-all: Prisma migration names are one long unbroken
                token (timestamp_description, 30-50+ chars, no spaces) -
                break-words alone doesn't wrap them, so they blew out this
                grid cell at narrow viewports (real 320px overflow, not a
                rare edge case - every migration name has this shape). */}
            <dd className="break-all text-sm text-foreground">
              {info.lastMigration ? info.lastMigration.name : "Bilinmiyor"}
            </dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-muted-foreground">
          Son güncelleme: {new Date(info.timestamp).toLocaleString("tr-TR")}
        </p>
      </Card>
    </div>
  );
}
