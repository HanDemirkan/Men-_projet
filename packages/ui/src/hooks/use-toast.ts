"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import type { ToastProps } from "../components/Toast";

export interface ToastItem {
  id: string;
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  variant?: ToastProps["variant"];
}

type ToastInput = Omit<ToastItem, "id">;

// Minimal module-level store (no context provider needed) so `toast()` can be
// called from anywhere - event handlers, effects - not just inside a
// component that's wrapped in a provider. Mirrors shadcn/ui's use-toast
// pattern, trimmed to what this product actually needs.
let toasts: ToastItem[] = [];
const listeners = new Set<(items: ToastItem[]) => void>();

function emit(): void {
  listeners.forEach((listener) => listener(toasts));
}

export function toast(input: ToastInput): { id: string; dismiss: () => void } {
  const id = crypto.randomUUID();
  toasts = [...toasts, { ...input, id }];
  emit();

  return {
    id,
    dismiss: () => dismissToast(id),
  };
}

export function dismissToast(id: string): void {
  toasts = toasts.filter((item) => item.id !== id);
  emit();
}

export function useToast(): {
  toasts: ToastItem[];
  toast: typeof toast;
  dismiss: typeof dismissToast;
} {
  const [state, setState] = useState(toasts);

  useEffect(() => {
    listeners.add(setState);
    return () => {
      listeners.delete(setState);
    };
  }, []);

  return { toasts: state, toast, dismiss: dismissToast };
}
