"use client";

import { AlertTriangle, BarChart3, Calendar, Package } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { type Column, TablaGenerica } from "@/components/ui/tabla-generica";

interface Existencia {
  id: number;
  nombre: string;
  stock_actual: number;
  stock_minimo: number;
  categoria_producto: { nombre: string };
  unidad_medida: { abreviatura: string };
}

interface Consumo {
  producto_id: number;
  producto_nombre: string;
  unidad: string;
  total_consumido: number;
}

export default function EstadisticasPage() {
  const [tab, setTab] = useState<"existencias" | "consumo">("existencias");
  const [existencias, setExistencias] = useState<Existencia[]>([]);
  const [consumos, setConsumos] = useState<Consumo[]>([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  const fetchExistencias = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reportes/existencias");
      const json = await res.json();
      setExistencias(json.data);
    } catch {
      toast.error("Error al cargar existencias");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchConsumo = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reportes/consumo-anual?year=${year}`);
      const json = await res.json();
      setConsumos(json.data);
    } catch {
      toast.error("Error al cargar consumo");
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    if (tab === "existencias") fetchExistencias();
    else fetchConsumo();
  }, [tab, fetchExistencias, fetchConsumo]);

  const existenciasColumns: Column<Existencia>[] = [
    { key: "nombre", header: "Producto", render: (e) => e.nombre },
    {
      key: "categoria",
      header: "Categoría",
      render: (e) => e.categoria_producto.nombre,
    },
    {
      key: "stock",
      header: "Stock Actual",
      render: (e) =>
        `${Number(e.stock_actual).toFixed(2)} ${e.unidad_medida.abreviatura}`,
    },
    {
      key: "minimo",
      header: "Stock Mínimo",
      render: (e) =>
        `${Number(e.stock_minimo).toFixed(2)} ${e.unidad_medida.abreviatura}`,
    },
    {
      key: "estado",
      header: "Estado",
      render: (e) =>
        Number(e.stock_actual) <= Number(e.stock_minimo)
          ? "⚠ Bajo"
          : "✓ Normal",
    },
  ];

  const consumoColumns: Column<Consumo>[] = [
    { key: "nombre", header: "Producto", render: (c) => c.producto_nombre },
    { key: "unidad", header: "Unidad", render: (c) => c.unidad },
    {
      key: "consumido",
      header: "Total Consumido",
      render: (c) => String(c.total_consumido),
    },
  ];

  const bajoStock = existencias.filter(
    (e) => Number(e.stock_actual) <= Number(e.stock_minimo),
  ).length;
  const totalStock = existencias.reduce(
    (s, e) => s + Number(e.stock_actual),
    0,
  );

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Estadísticas</h1>

        <div className="flex gap-2 border-b pb-2">
          <Button
            variant={tab === "existencias" ? "default" : "outline"}
            size="sm"
            onClick={() => setTab("existencias")}
          >
            Existencias
          </Button>
          <Button
            variant={tab === "consumo" ? "default" : "outline"}
            size="sm"
            onClick={() => setTab("consumo")}
          >
            Consumo Anual
          </Button>
        </div>

        {tab === "existencias" && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard
                title="Total Productos"
                value={existencias.length}
                icon={Package}
                color="blue"
              />
              <StatCard
                title="Stock Bajo"
                value={bajoStock}
                icon={AlertTriangle}
                color="red"
              />
              <StatCard
                title="Stock Total"
                value={totalStock.toFixed(2)}
                icon={BarChart3}
                color="green"
              />
            </div>
            <TablaGenerica
              columns={existenciasColumns}
              data={existencias}
              total={existencias.length}
              page={1}
              pageSize={100}
              loading={loading}
              onPageChange={() => {}}
            />
          </>
        )}

        {tab === "consumo" && (
          <>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <select
                className="border rounded-md px-3 py-1 text-sm bg-background"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
              >
                {Array.from({ length: 5 }, (_, i) => {
                  const y = new Date().getFullYear() - i;
                  return (
                    <option key={`year-${y}`} value={y}>
                      {y}
                    </option>
                  );
                })}
              </select>
            </div>
            <TablaGenerica
              columns={consumoColumns}
              data={consumos}
              total={consumos.length}
              page={1}
              pageSize={100}
              loading={loading}
              onPageChange={() => {}}
            />
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
