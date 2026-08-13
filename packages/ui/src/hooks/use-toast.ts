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

type ToastInput = Omit<ToastItem, "id"> & { id?: string };

// Minimal module-level store (no context provider needed) so `toast()` can be
// called from anywhere - event handlers, effects - not just inside a
// component that's wrapped in a provider. Mirrors shadcn/ui's use-toast
// pattern, trimmed to what this product actually needs.
let toasts: ToastItem[] = [];
const listeners = new Set<(items: ToastItem[]) => void>();

function emit(): void {
  listeners.forEach((listener) => listener(toasts));
}

// Passing `id` lets a caller update an existing toast in place (e.g. repeated
// identical login failures) instead of stacking a new one on every call.
export function toast(input: ToastInput): { id: string; dismiss: () => void } {
  const { id: inputId, ...rest } = input;
  const existingIndex = inputId ? toasts.findIndex((item) => item.id === inputId) : -1;
  const id = inputId ?? crypto.randomUUID();

  if (existingIndex >= 0) {
    toasts = toasts.map((item, index) => (index === existingIndex ? { ...rest, id } : item));
  } else {
    toasts = [...toasts, { ...rest, id }];
  }
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
