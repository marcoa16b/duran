import { Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

export default function Loading() {
  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Reportes</h1>
        </div>
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </div>
    </DashboardLayout>
  );
}
