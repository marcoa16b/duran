"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";

// biome-ignore lint/suspicious/noShadowRestrictedNames: Next.js convention for error.tsx
export default function Error({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(_error);
  }, [_error]);

  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-muted-foreground">
        <AlertTriangle className="h-10 w-10 text-destructive" />
        <p className="font-medium">Error al cargar reportes</p>
        <p className="text-sm">{_error.message}</p>
        <Button variant="outline" size="sm" onClick={reset}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Reintentar
        </Button>
      </div>
    </DashboardLayout>
  );
}
