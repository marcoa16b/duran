"use client";

import { format } from "date-fns";
import {
  AlertTriangle,
  DollarSign,
  FileSpreadsheet,
  FileText,
  Package,
  TrendingDown,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatCard } from "@/components/ui/stat-card";
import { type Column, TablaGenerica } from "@/components/ui/tabla-generica";

interface ExistenciaItem {
  id: number;
  nombre: string;
  stock_actual: number;
  stock_minimo: number;
  ubicacion: string | null;
  categoria_producto: { id: number; nombre: string } | null;
  unidad_medida: { id: number; nombre: string; abreviatura: string };
}

interface PerdidaDetalle {
  id: number;
  cantidad: number;
  motivo: string | null;
  lote: {
    codigo_lote: string | null;
    precio_unitario: number | null;
    producto: { nombre: string };
  };
}

interface PerdidaSalida {
  id: number;
  fecha: string;
  tipo: { nombre: string };
  detalles: PerdidaDetalle[];
}

interface PerdidaFlatRow {
  fecha: string;
  producto: string;
  cantidad: number;
  motivo: string;
  tipo: string;
  valor: number | null;
  lote: string | null;
}

interface ConsumoItem {
  producto_id: number;
  producto_nombre: string;
  unidad: string;
  total_consumido: number;
}

export default function ReportesPage() {
  const [tab, setTab] = useState<"existencias" | "perdidas" | "consumo">(
    "existencias",
  );
  const [exporting, setExporting] = useState(false);

  const [existencias, setExistencias] = useState<ExistenciaItem[]>([]);
  const [existenciasLoading, setExistenciasLoading] = useState(true);

  const [perdidas, setPerdidas] = useState<{
    salidas: PerdidaSalida[];
    totalPerdido: number;
  }>({ salidas: [], totalPerdido: 0 });
  const [perdidasLoading, setPerdidasLoading] = useState(false);
  const [perdidasFechaInicio, setPerdidasFechaInicio] = useState(
    format(new Date(new Date().getFullYear(), 0, 1), "yyyy-MM-dd"),
  );
  const [perdidasFechaFin, setPerdidasFechaFin] = useState(
    format(new Date(), "yyyy-MM-dd"),
  );

  const [consumo, setConsumo] = useState<ConsumoItem[]>([]);
  const [consumoLoading, setConsumoLoading] = useState(false);
  const [consumoYear, setConsumoYear] = useState(
    String(new Date().getFullYear()),
  );

  const fetchExistencias = useCallback(async () => {
    setExistenciasLoading(true);
    try {
      const res = await fetch("/api/reportes/existencias");
      const json = await res.json();
      setExistencias(json.data ?? []);
    } catch {
      toast.error("Error al cargar existencias");
    } finally {
      setExistenciasLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "existencias") fetchExistencias();
  }, [tab, fetchExistencias]);

  const fetchPerdidas = useCallback(async (inicio: string, fin: string) => {
    setPerdidasLoading(true);
    try {
      const res = await fetch(
        `/api/reportes/perdidas?fechaInicio=${inicio}&fechaFin=${fin}`,
      );
      const json = await res.json();
      setPerdidas({
        salidas: json.salidas ?? [],
        totalPerdido: json.totalPerdido ?? 0,
      });
    } catch {
      toast.error("Error al cargar pérdidas");
    } finally {
      setPerdidasLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "perdidas") {
      fetchPerdidas(perdidasFechaInicio, perdidasFechaFin);
    }
  }, [tab, perdidasFechaInicio, perdidasFechaFin, fetchPerdidas]);

  const fetchConsumo = useCallback(async (year: string) => {
    setConsumoLoading(true);
    try {
      const res = await fetch(`/api/reportes/consumo-anual?year=${year}`);
      const json = await res.json();
      setConsumo(json.data ?? []);
    } catch {
      toast.error("Error al cargar consumo anual");
    } finally {
      setConsumoLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "consumo") fetchConsumo(consumoYear);
  }, [tab, consumoYear, fetchConsumo]);

  function flattenPerdidas(rows: PerdidaSalida[]): PerdidaFlatRow[] {
    const flat: PerdidaFlatRow[] = [];
    for (const s of rows) {
      for (const d of s.detalles) {
        flat.push({
          fecha: s.fecha,
          producto: d.lote.producto.nombre,
          cantidad: Number(d.cantidad),
          motivo: d.motivo ?? "—",
          tipo: s.tipo.nombre,
          valor:
            d.lote.precio_unitario != null
              ? Number(d.cantidad) * Number(d.lote.precio_unitario)
              : null,
          lote: d.lote.codigo_lote,
        });
      }
    }
    return flat;
  }

  async function exportPDF() {
    setExporting(true);
    try {
      let titulo = "";
      let headers: string[] = [];
      let rows: string[][] = [];

      if (tab === "existencias") {
        titulo = "Reporte de Existencias";
        headers = [
          "Producto",
          "Stock Actual",
          "Stock Mínimo",
          "Categoría",
          "Ubicación",
        ];
        rows = existencias.map((p) => [
          p.nombre,
          String(p.stock_actual),
          String(p.stock_minimo),
          p.categoria_producto?.nombre ?? "—",
          p.ubicacion ?? "—",
        ]);
      } else if (tab === "perdidas") {
        titulo = "Reporte de Pérdidas";
        headers = ["Fecha", "Producto", "Cantidad", "Motivo", "Tipo", "Valor"];
        const flat = flattenPerdidas(perdidas.salidas);
        rows = flat.map((r) => [
          format(new Date(r.fecha), "dd/MM/yyyy"),
          r.producto,
          String(r.cantidad),
          r.motivo,
          r.tipo,
          r.valor != null ? `₡${r.valor.toFixed(2)}` : "—",
        ]);
      } else {
        titulo = `Reporte de Consumo Anual ${consumoYear}`;
        headers = ["Producto", "Unidad", "Total Consumido"];
        rows = consumo.map((c) => [
          c.producto_nombre,
          c.unidad,
          String(c.total_consumido),
        ]);
      }

      const pdfRes = await fetch("/api/reportes/exportar/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo,
          subtitulo: `Generado ${format(new Date(), "dd/MM/yyyy")}`,
          headers,
          rows,
        }),
      });
      const blob = await pdfRes.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reporte-${tab}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Error al exportar PDF");
    } finally {
      setExporting(false);
    }
  }

  async function exportExcel() {
    setExporting(true);
    try {
      let titulo = "";
      let headers: string[] = [];
      let rows: string[][] = [];

      if (tab === "existencias") {
        titulo = "Existencias";
        headers = [
          "Producto",
          "Stock Actual",
          "Stock Mínimo",
          "Categoría",
          "Ubicación",
        ];
        rows = existencias.map((p) => [
          p.nombre,
          String(p.stock_actual),
          String(p.stock_minimo),
          p.categoria_producto?.nombre ?? "—",
          p.ubicacion ?? "—",
        ]);
      } else if (tab === "perdidas") {
        titulo = "Pérdidas";
        headers = ["Fecha", "Producto", "Cantidad", "Motivo", "Tipo", "Valor"];
        const flat = flattenPerdidas(perdidas.salidas);
        rows = flat.map((r) => [
          format(new Date(r.fecha), "dd/MM/yyyy"),
          r.producto,
          String(r.cantidad),
          r.motivo,
          r.tipo,
          r.valor != null ? `₡${r.valor.toFixed(2)}` : "—",
        ]);
      } else {
        titulo = `Consumo Anual ${consumoYear}`;
        headers = ["Producto", "Unidad", "Total Consumido"];
        rows = consumo.map((c) => [
          c.producto_nombre,
          c.unidad,
          String(c.total_consumido),
        ]);
      }

      const xlRes = await fetch("/api/reportes/exportar/excel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo, headers, rows }),
      });
      const blob = await xlRes.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reporte-${tab}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Error al exportar Excel");
    } finally {
      setExporting(false);
    }
  }

  const existenciasColumns: Column<ExistenciaItem>[] = [
    { key: "nombre", header: "Producto", render: (p) => p.nombre },
    {
      key: "stock_actual",
      header: "Stock Actual",
      render: (p) => {
        const bajo = Number(p.stock_actual) <= Number(p.stock_minimo);
        return (
          <Badge variant={bajo ? "destructive" : "secondary"}>
            {Number(p.stock_actual).toFixed(3)}
          </Badge>
        );
      },
    },
    {
      key: "stock_minimo",
      header: "Stock Mín.",
      render: (p) => String(p.stock_minimo),
    },
    {
      key: "categoria",
      header: "Categoría",
      render: (p) => p.categoria_producto?.nombre ?? "—",
    },
    {
      key: "ubicacion",
      header: "Ubicación",
      render: (p) => p.ubicacion ?? "—",
    },
    {
      key: "unidad",
      header: "Unidad",
      render: (p) => p.unidad_medida.abreviatura,
    },
  ];

  const perdidasColumns: Column<PerdidaFlatRow>[] = [
    {
      key: "fecha",
      header: "Fecha",
      render: (r) => format(new Date(r.fecha), "dd/MM/yyyy"),
    },
    { key: "producto", header: "Producto", render: (r) => r.producto },
    {
      key: "cantidad",
      header: "Cantidad",
      render: (r) => (
        <Badge variant="destructive">{Number(r.cantidad).toFixed(3)}</Badge>
      ),
    },
    { key: "motivo", header: "Motivo", render: (r) => r.motivo },
    { key: "tipo", header: "Tipo", render: (r) => r.tipo },
    {
      key: "valor",
      header: "Valor pérdida",
      render: (r) =>
        r.valor != null ? (
          `₡${r.valor.toFixed(2)}`
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
  ];

  const consumoColumns: Column<ConsumoItem>[] = [
    {
      key: "producto",
      header: "Producto",
      render: (c) => c.producto_nombre,
    },
    { key: "unidad", header: "Unidad", render: (c) => c.unidad },
    {
      key: "consumido",
      header: "Total Consumido",
      render: (c) => (
        <Badge variant="secondary">
          {Number(c.total_consumido).toFixed(3)}
        </Badge>
      ),
    },
  ];

  const perdidasFlat = flattenPerdidas(perdidas.salidas);

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Reportes</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportPDF}
              disabled={exporting}
            >
              <FileText className="h-4 w-4 mr-2" />
              PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportExcel}
              disabled={exporting}
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Excel
            </Button>
          </div>
        </div>

        <div className="flex gap-2 border-b pb-2">
          <Button
            variant={tab === "existencias" ? "default" : "outline"}
            size="sm"
            onClick={() => setTab("existencias")}
          >
            Existencias
          </Button>
          <Button
            variant={tab === "perdidas" ? "default" : "outline"}
            size="sm"
            onClick={() => setTab("perdidas")}
          >
            Pérdidas
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
          <div className="space-y-4">
            <div className="flex gap-4">
              <StatCard
                title="Total Productos"
                value={existencias.length}
                icon={Package}
                color="blue"
              />
              <StatCard
                title="Productos bajo stock"
                value={
                  existencias.filter(
                    (p) => Number(p.stock_actual) <= Number(p.stock_minimo),
                  ).length
                }
                icon={AlertTriangle}
                color="red"
              />
            </div>
            <TablaGenerica
              columns={existenciasColumns}
              data={existencias}
              total={existencias.length}
              page={1}
              pageSize={100}
              loading={existenciasLoading}
              onPageChange={() => {}}
            />
          </div>
        )}

        {tab === "perdidas" && (
          <div className="space-y-4">
            <div className="flex items-end gap-2">
              <div>
                <Label htmlFor="perdidasDesde">Desde</Label>
                <Input
                  id="perdidasDesde"
                  type="date"
                  value={perdidasFechaInicio}
                  onChange={(e) => setPerdidasFechaInicio(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="perdidasHasta">Hasta</Label>
                <Input
                  id="perdidasHasta"
                  type="date"
                  value={perdidasFechaFin}
                  onChange={(e) => setPerdidasFechaFin(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <StatCard
                title="Total pérdidas (unidades)"
                value={Number(perdidas.totalPerdido).toFixed(3)}
                icon={TrendingDown}
                color="red"
              />
              <StatCard
                title="Registros"
                value={perdidasFlat.length}
                icon={DollarSign}
                color="yellow"
              />
            </div>

            <TablaGenerica
              columns={perdidasColumns}
              data={perdidasFlat}
              total={perdidasFlat.length}
              page={1}
              pageSize={100}
              loading={perdidasLoading}
              onPageChange={() => {}}
            />
          </div>
        )}

        {tab === "consumo" && (
          <div className="space-y-4">
            <div className="flex items-end gap-2">
              <div className="w-32">
                <Label htmlFor="consumoYear">Año</Label>
                <Input
                  id="consumoYear"
                  type="number"
                  min={2020}
                  max={2099}
                  value={consumoYear}
                  onChange={(e) => setConsumoYear(e.target.value)}
                />
              </div>
            </div>

            <TablaGenerica
              columns={consumoColumns}
              data={consumo}
              total={consumo.length}
              page={1}
              pageSize={100}
              loading={consumoLoading}
              emptyMessage="No hay datos de consumo para este año"
              onPageChange={() => {}}
            />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
