"use client";

import { Toaster, TooltipProvider } from "@qr-platform/ui";
import type { ReactNode } from "react";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider delayDuration={200}>
      {children}
      <Toaster />
    </TooltipProvider>
  );
}
