"use client";

import type { StorefrontConfig } from "@qr-platform/shared";
import { Button } from "@qr-platform/ui";
import { Expand, Minus, Plus, Smartphone, Tablet, Monitor, X } from "lucide-react";
import { useState } from "react";

import { StorefrontRenderer } from "../components/StorefrontRenderer";

import type { PublicTenant, StorefrontMenu } from "@/types/storefront";

export interface DevicePreviewProps {
  tenant: PublicTenant;
  config: StorefrontConfig;
  menus: StorefrontMenu[];
}

type DeviceSize = "mobile" | "tablet" | "desktop";

const DEVICE_WIDTH: Record<DeviceSize, number> = { mobile: 375, tablet: 768, desktop: 1280 };
const DEVICE_LABEL: Record<DeviceSize, string> = { mobile: "Mobil", tablet: "Tablet", desktop: "Masaüstü" };
const DEVICE_ICON: Record<DeviceSize, typeof Smartphone> = { mobile: Smartphone, tablet: Tablet, desktop: Monitor };

export function DevicePreview({ tenant, config, menus }: DevicePreviewProps) {
  const [device, setDevice] = useState<DeviceSize>("mobile");
  const [zoom, setZoom] = useState(100);
  const [fullscreen, setFullscreen] = useState(false);

  const frame = (scale: number) => (
    <div className="flex justify-center overflow-auto rounded-xl border border-border bg-muted/30 p-6">
      <div
        style={{ width: DEVICE_WIDTH[device], transform: `scale(${scale / 100})`, transformOrigin: "top center" }}
        className="shrink-0 overflow-hidden rounded-[24px] border border-border bg-background shadow-md"
      >
        <StorefrontRenderer tenant={tenant} config={config} mode="menu" menus={menus} />
      </div>
    </div>
  );

  const controls = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex gap-1 rounded-md border border-border p-1">
        {(["mobile", "tablet", "desktop"] as DeviceSize[]).map((size) => {
          const Icon = DEVICE_ICON[size];
          return (
            <button
              key={size}
              type="button"
              onClick={() => setDevice(size)}
              aria-pressed={device === size}
              className="flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium transition-colors"
              style={{
                backgroundColor: device === size ? "hsl(var(--primary))" : "transparent",
                color: device === size ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))",
              }}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              {DEVICE_LABEL[size]}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => setZoom((value) => Math.max(50, value - 10))} aria-label="Uzaklaştır">
          <Minus className="h-4 w-4" />
        </Button>
        <span className="w-10 text-center text-xs text-muted-foreground">{zoom}%</span>
        <Button variant="outline" size="icon" onClick={() => setZoom((value) => Math.min(100, value + 10))} aria-label="Yakınlaştır">
          <Plus className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={() => setFullscreen(true)} aria-label="Tam ekran önizleme">
          <Expand className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-3">
      {controls}
      {frame(zoom)}

      {fullscreen ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-sm font-semibold">Tam Ekran Önizleme</p>
            <Button variant="ghost" size="icon" onClick={() => setFullscreen(false)} aria-label="Kapat">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-auto p-6">{frame(100)}</div>
        </div>
      ) : null}
    </div>
  );
}
