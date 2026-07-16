"use client";

import { useToast } from "../hooks/use-toast";

import {
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastRoot,
  ToastTitle,
  ToastViewport,
} from "./Toast";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, variant }) => (
        <ToastRoot
          key={id}
          variant={variant}
          onOpenChange={(open) => (open ? undefined : dismiss(id))}
        >
          <div className="grid flex-1 gap-1">
            {title ? <ToastTitle>{title}</ToastTitle> : null}
            {description ? <ToastDescription>{description}</ToastDescription> : null}
          </div>
          {action ? <ToastAction altText="action">{action}</ToastAction> : null}
          <ToastClose />
        </ToastRoot>
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}
