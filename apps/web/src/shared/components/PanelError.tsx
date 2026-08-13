"use client";

import { Button, EmptyState } from "@qr-platform/ui";
import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";

export interface PanelErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

// Next.js error.tsx convention: catches a thrown error anywhere in this
// route segment's tree and renders this instead of Next's raw dev/500
// overlay. Shares EmptyState's visual language with the product's actual
// empty states - same shape, different icon/copy/action - rather than a
// one-off error page design.
export function PanelError({ error, reset }: PanelErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <EmptyState
      icon={AlertTriangle}
      title="Bir şeyler ters gitti"
      description="Bu sayfa yüklenirken beklenmeyen bir hata oluştu. Tekrar deneyebilir veya sayfayı yenileyebilirsiniz."
      action={
        <Button variant="outline" onClick={() => reset()}>
          Tekrar Dene
        </Button>
      }
    />
  );
}
