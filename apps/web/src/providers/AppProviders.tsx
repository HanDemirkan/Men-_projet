"use client";

import { Toaster, TooltipProvider } from "@qr-platform/ui";
import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    // "user" - every Framer Motion animation in the app automatically
    // respects the OS prefers-reduced-motion setting, without each
    // component checking it individually. CSS-driven animations
    // (Dialog/Drawer/Toast) get the same floor from globals.css instead,
    // since they're outside Framer Motion's reach.
    <MotionConfig reducedMotion="user">
      <TooltipProvider delayDuration={200}>
        {children}
        <Toaster />
      </TooltipProvider>
    </MotionConfig>
  );
}
