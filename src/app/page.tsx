"use client";

import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  BellRing,
  Package,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { cn } from "@/lib/utils";

interface DashboardKPI {
  totalProductos: number;
  productosBajoStock: number;
  entradasMes: number;
  salidasMes: number;
  lotesPorVencer: number;
  alertasNoLeidas: number;
}

const quickAccessRows = [
  [
    {
      href: "/productos",
      label: "Productos",
      icon: Package,
      color: "blue" as const,
    },
    {
      href: "/entradas",
      label: "Entradas",
      icon: ArrowDownToLine,
      color: "green" as const,
    },
    {
      href: "/salidas",
      label: "Salidas",
      icon: ArrowUpFromLine,
      color: "yellow" as const,
    },
  ] as const,
  [
    {
      href: "/recetas",
      label: "Recetas",
      icon: Package,
      color: "purple" as const,
    },
    {
      href: "/produccion-diaria",
      label: "Producción",
      icon: Package,
      color: "green" as const,
    },
    {
      href: "/alertas",
      label: "Alertas",
      icon: BellRing,
      color: "red" as const,
    },
  ] as const,
];

const colorStyles: Record<string, string> = {
  blue: "bg-blue-500/10 text-blue-500",
  green: "bg-green-500/10 text-green-500",
  yellow: "bg-yellow-500/10 text-yellow-500",
  red: "bg-red-500/10 text-red-500",
  purple: "bg-purple-500/10 text-purple-500",
};

export default function HomePage() {
  const [kpi, setKpi] = useState<DashboardKPI | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchKPI = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/reportes/resumen");
      const json = await res.json();
      setKpi(json.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKPI();
  }, [fetchKPI]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchKPI}
            disabled={loading}
          >
            <RefreshCw
              className={cn("h-4 w-4 mr-2", loading && "animate-spin")}
            />
            Actualizar
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <StatCard
            title="Productos"
            value={kpi?.totalProductos ?? "—"}
            icon={Package}
            color="blue"
          />
          <StatCard
            title="Stock Bajo"
            value={kpi?.productosBajoStock ?? "—"}
            icon={AlertTriangle}
            color="red"
          />
          <StatCard
            title="Entradas del Mes"
            value={kpi?.entradasMes ?? "—"}
            icon={ArrowDownToLine}
            color="green"
          />
          <StatCard
            title="Salidas del Mes"
            value={kpi?.salidasMes ?? "—"}
            icon={ArrowUpFromLine}
            color="yellow"
          />
          <StatCard
            title="Alertas"
            value={kpi?.alertasNoLeidas ?? "—"}
            icon={BellRing}
            color="purple"
          />
        </div>

        {kpi && kpi.alertasNoLeidas > 0 && (
          <Link
            href="/alertas"
            className="flex items-center gap-2 p-3 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 text-sm"
          >
            <BellRing className="h-4 w-4" />
            {kpi.alertasNoLeidas} alerta(s) sin leer
          </Link>
        )}

        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Accesos rápidos</h2>
          {quickAccessRows.map((row) => (
            <div
              key={`row-${row[0].href}`}
              className="grid grid-cols-1 sm:grid-cols-3 gap-3"
            >
              {row.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-accent transition-colors"
                >
                  <div
                    className={cn("p-2 rounded-full", colorStyles[item.color])}
                  >
                    <item.icon className="h-5 w-5" />
                  </div>
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
