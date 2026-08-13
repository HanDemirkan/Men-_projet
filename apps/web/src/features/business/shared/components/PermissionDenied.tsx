import { EmptyState } from "@qr-platform/ui";
import { ShieldAlert } from "lucide-react";

export interface PermissionDeniedProps {
  description?: string;
}

export function PermissionDenied({ description }: PermissionDeniedProps) {
  return (
    <EmptyState
      icon={ShieldAlert}
      title="Bu bölüme erişim yetkiniz yok"
      description={description ?? "Bu ekranı görüntülemek için gereken izne sahip değilsiniz."}
    />
  );
}
