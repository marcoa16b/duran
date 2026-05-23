"use client";

import { format } from "date-fns";
import { Eye, FlaskConical, Plus, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type Column, TablaGenerica } from "@/components/ui/tabla-generica";

interface Produccion {
  id: number;
  fecha: string;
  cantidad_producida: number;
  observaciones: string | null;
  receta: { nombre: string; producto: { nombre: string } };
  _count: { detalles: number };
}

interface RecetaCatalogo {
  id: number;
  nombre: string;
  activo: boolean;
  producto: { nombre: string };
  _count?: { ingredientes: number };
}

interface ProduccionDetalleLote {
  id: number;
  codigo_lote: string | null;
  fecha_vencimiento: string | null;
  producto: { nombre: string; unidad_medida: { abreviatura: string } };
}

interface ProduccionDetalle {
  id: number;
  cantidad: number;
  lote: ProduccionDetalleLote;
}

interface ProduccionDetail {
  id: number;
  fecha: string;
  cantidad_producida: number;
  observaciones: string | null;
  receta: { nombre: string; producto: { nombre: string } };
  usuario: { nombre: string } | null;
  detalles: ProduccionDetalle[];
}

interface VerifyResultItem {
  producto_id: number;
  producto_nombre: string;
  unidad: string;
  cantidad_por_unidad: number;
  cantidad_necesaria: number;
  stock_disponible: number;
  suficiente: boolean;
}

interface VerifyResult {
  disponible: boolean;
  detalle: VerifyResultItem[];
}

export default function ProduccionDiariaPage() {
  const [data, setData] = useState<Produccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [formRecetaId, setFormRecetaId] = useState("");
  const [formCantidad, setFormCantidad] = useState("");
  const [formFecha, setFormFecha] = useState(format(new Date(), "yyyy-MM-dd"));
  const [formObservaciones, setFormObservaciones] = useState("");
  const [recetas, setRecetas] = useState<RecetaCatalogo[]>([]);
  const [selectedRecetaIngs, setSelectedRecetaIngs] = useState<Array<{
    producto_nombre: string;
    cantidad: number;
    unidad: string;
  }> | null>(null);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState<ProduccionDetail | null>(null);

  const [verifyOpen, setVerifyOpen] = useState(false);
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [verifying, setVerifying] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (fechaInicio) params.set("fechaInicio", fechaInicio);
      if (fechaFin) params.set("fechaFin", fechaFin);
      const res = await fetch(`/api/produccion?${params}`);
      const json = await res.json();
      setData(json.data ?? []);
    } catch {
      toast.error("Error al cargar producción");
    } finally {
      setLoading(false);
    }
  }, [fechaInicio, fechaFin]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!formOpen) return;
    const loadRecetas = async () => {
      try {
        const res = await fetch("/api/recetas");
        const json = await res.json();
        const all: RecetaCatalogo[] = json.data ?? [];
        setRecetas(all.filter((r) => r.activo !== false));
      } catch {
        toast.error("Error al cargar recetas");
      }
    };
    loadRecetas();
  }, [formOpen]);

  useEffect(() => {
    if (!formRecetaId) {
      setSelectedRecetaIngs(null);
      return;
    }
    const loadIngredientes = async () => {
      try {
        const res = await fetch(`/api/recetas/${formRecetaId}`);
        const json = await res.json();
        const receta = json.data;
        if (receta?.ingredientes) {
          setSelectedRecetaIngs(
            receta.ingredientes.map(
              (ing: {
                producto: {
                  nombre: string;
                  unidad_medida: { abreviatura: string };
                };
                cantidad: number;
              }) => ({
                producto_nombre: ing.producto.nombre,
                cantidad: Number(ing.cantidad),
                unidad: ing.producto.unidad_medida.abreviatura,
              }),
            ),
          );
        }
      } catch {
        setSelectedRecetaIngs(null);
      }
    };
    loadIngredientes();
  }, [formRecetaId]);

  function handleFormOpenChange(open: boolean) {
    if (!open) {
      setFormRecetaId("");
      setFormCantidad("");
      setFormFecha(format(new Date(), "yyyy-MM-dd"));
      setFormObservaciones("");
      setSelectedRecetaIngs(null);
    }
    setFormOpen(open);
  }

  async function handleRegister() {
    if (!formRecetaId) {
      toast.error("Seleccione una receta");
      return;
    }
    const cantidad = Number(formCantidad);
    if (!cantidad || cantidad <= 0) {
      toast.error("Cantidad inválida");
      return;
    }
    if (!formFecha) {
      toast.error("Seleccione una fecha");
      return;
    }

    try {
      const verifyRes = await fetch(
        `/api/recetas/${formRecetaId}/verify?cantidad=${cantidad}`,
      );
      const verifyJson = await verifyRes.json();
      if (!verifyRes.ok)
        throw new Error(verifyJson.error ?? "Error al verificar");

      if (!verifyJson.data.disponible) {
        const faltantes = verifyJson.data.detalle
          .filter(
            (d: { suficiente: boolean; producto_nombre: string }) =>
              !d.suficiente,
          )
          .map((d: { producto_nombre: string }) => d.producto_nombre)
          .join(", ");
        toast.error(
          `Insumos insuficientes: ${faltantes}. Verifique disponibilidad.`,
        );
        return;
      }

      const res = await fetch("/api/produccion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receta_id: Number(formRecetaId),
          cantidad_producida: cantidad,
          fecha: formFecha,
          observaciones: formObservaciones || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Error al registrar producción");
      }
      toast.success("Producción registrada");
      handleFormOpenChange(false);
      fetchData();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al registrar");
    }
  }

  async function handleVerify() {
    if (!formRecetaId) {
      toast.error("Seleccione una receta");
      return;
    }
    const cantidad = Number(formCantidad);
    if (!cantidad || cantidad <= 0) {
      toast.error("Cantidad inválida");
      return;
    }
    setVerifying(true);
    try {
      const res = await fetch(
        `/api/recetas/${formRecetaId}/verify?cantidad=${cantidad}`,
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error al verificar");
      setVerifyResult(json.data);
      setVerifyOpen(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al verificar");
    } finally {
      setVerifying(false);
    }
  }

  async function handleViewDetail(p: Produccion) {
    try {
      const res = await fetch(`/api/produccion/${p.id}`);
      const json = await res.json();
      setDetailData(json.data);
      setDetailOpen(true);
    } catch {
      toast.error("Error al cargar detalle");
    }
  }

  const start = (page - 1) * pageSize;
  const paginatedData = data.slice(start, start + pageSize);

  const columns: Column<Produccion>[] = [
    {
      key: "fecha",
      header: "Fecha",
      render: (p) => format(new Date(p.fecha), "dd/MM/yyyy"),
    },
    { key: "receta", header: "Receta", render: (p) => p.receta.nombre },
    {
      key: "producto",
      header: "Producto",
      render: (p) => p.receta.producto.nombre,
    },
    {
      key: "cantidad",
      header: "Cantidad",
      render: (p) => (
        <Badge
          variant="secondary"
          className="text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30"
        >
          {Number(p.cantidad_producida).toFixed(3)}
        </Badge>
      ),
    },
    {
      key: "observaciones",
      header: "Observaciones",
      render: (p) => p.observaciones ?? "-",
    },
    {
      key: "acciones",
      header: "Acciones",
      render: (p) => (
        <Button variant="outline" size="sm" onClick={() => handleViewDetail(p)}>
          <Eye className="h-3 w-3 mr-1" />
          Ver
        </Button>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Producción Diaria</h1>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Producción
          </Button>
        </div>

        <div className="flex items-end gap-2">
          <div>
            <Label htmlFor="fechaInicio">Desde</Label>
            <Input
              id="fechaInicio"
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="fechaFin">Hasta</Label>
            <Input
              id="fechaFin"
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setPage(1);
              fetchData();
            }}
          >
            <Search className="h-4 w-4 mr-1" />
            Filtrar
          </Button>
          {(fechaInicio || fechaFin) && (
            <Button
              variant="ghost"
              onClick={() => {
                setFechaInicio("");
                setFechaFin("");
                setPage(1);
              }}
            >
              Limpiar
            </Button>
          )}
        </div>

        <TablaGenerica
          columns={columns}
          data={paginatedData}
          total={data.length}
          page={page}
          pageSize={pageSize}
          loading={loading}
          onPageChange={setPage}
        />
      </div>

      <Dialog open={formOpen} onOpenChange={handleFormOpenChange}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Registrar Producción</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Receta</Label>
              <Select
                value={formRecetaId}
                onValueChange={(v) => setFormRecetaId(v as string)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar receta">
                    {(value: string | null) => {
                      if (!value) return "Seleccionar receta";
                      return (
                        recetas.find((r) => String(r.id) === value)?.nombre ??
                        value
                      );
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {recetas.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      {r.nombre} — {r.producto.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedRecetaIngs && (
              <div className="rounded-md border border-border p-3 space-y-1">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Ingredientes por unidad:
                </p>
                {selectedRecetaIngs.map((ing, i) => (
                  <div
                    key={`${ing.producto_nombre}-${i}`}
                    className="flex items-center justify-between text-sm"
                  >
                    <span>{ing.producto_nombre}</span>
                    <span className="text-muted-foreground">
                      {Number(ing.cantidad).toFixed(3)} {ing.unidad}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="cantidad">Cantidad a producir</Label>
                <Input
                  id="cantidad"
                  type="number"
                  step="0.001"
                  min="0.001"
                  placeholder="0"
                  value={formCantidad}
                  onChange={(e) => setFormCantidad(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="fecha">Fecha</Label>
                <Input
                  id="fecha"
                  type="date"
                  value={formFecha}
                  onChange={(e) => setFormFecha(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="observaciones">Observaciones</Label>
              <textarea
                id="observaciones"
                className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none"
                value={formObservaciones}
                onChange={(e) => setFormObservaciones(e.target.value)}
              />
            </div>

            <div className="flex justify-between gap-2">
              <Button
                variant="outline"
                className="text-green-600 border-green-600/50 hover:bg-green-600/10"
                onClick={handleVerify}
                disabled={verifying}
              >
                <FlaskConical className="h-4 w-4 mr-2" />
                {verifying ? "Verificando..." : "Verificar disponibilidad"}
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleFormOpenChange(false)}
                >
                  Cancelar
                </Button>
                <Button onClick={handleRegister}>Registrar</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={verifyOpen} onOpenChange={setVerifyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disponibilidad de insumos</DialogTitle>
          </DialogHeader>
          {verifyResult && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {verifyResult.disponible ? (
                  <Badge
                    variant="secondary"
                    className="text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30"
                  >
                    Insumos disponibles
                  </Badge>
                ) : (
                  <Badge variant="destructive">Insumos insuficientes</Badge>
                )}
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {verifyResult.detalle.map((item) => (
                  <div
                    key={item.producto_id}
                    className="flex items-center justify-between text-sm py-1"
                  >
                    <span className="font-medium">{item.producto_nombre}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">
                        Nec: {Number(item.cantidad_necesaria).toFixed(3)}
                      </span>
                      <span className="text-muted-foreground">
                        Stock: {Number(item.stock_disponible).toFixed(3)}
                      </span>
                      {item.suficiente ? (
                        <Badge
                          variant="secondary"
                          className="text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30 text-xs"
                        >
                          OK
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="text-xs">
                          Falta:{" "}
                          {(
                            item.cantidad_necesaria - item.stock_disponible
                          ).toFixed(3)}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setVerifyOpen(false)}
            >
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalle de Producción</DialogTitle>
          </DialogHeader>
          {detailData && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Receta</p>
                  <p className="font-medium">{detailData.receta.nombre}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Producto</p>
                  <p className="font-medium">
                    {detailData.receta.producto.nombre}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Fecha</p>
                  <p className="font-medium">
                    {format(new Date(detailData.fecha), "dd/MM/yyyy")}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Cantidad producida</p>
                  <p className="font-medium">
                    <Badge
                      variant="secondary"
                      className="text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30"
                    >
                      {Number(detailData.cantidad_producida).toFixed(3)}
                    </Badge>
                  </p>
                </div>
                {detailData.usuario && (
                  <div>
                    <p className="text-muted-foreground">Registrado por</p>
                    <p className="font-medium">{detailData.usuario.nombre}</p>
                  </div>
                )}
                {detailData.observaciones && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Observaciones</p>
                    <p className="font-medium">{detailData.observaciones}</p>
                  </div>
                )}
              </div>

              <hr className="border-border" />

              <div className="space-y-2">
                <p className="text-sm font-medium">Lotes consumidos (FIFO):</p>
                {detailData.detalles.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Sin lotes registrados
                  </p>
                ) : (
                  <div className="space-y-2">
                    {detailData.detalles.map((det) => (
                      <div
                        key={det.id}
                        className="flex items-center justify-between rounded-md border border-border p-3 text-sm"
                      >
                        <div className="space-y-1">
                          <p className="font-medium">
                            {det.lote.producto.nombre}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Lote: {det.lote.codigo_lote ?? "N/A"}
                            {det.lote.fecha_vencimiento &&
                              ` | Vence: ${format(new Date(det.lote.fecha_vencimiento), "dd/MM/yyyy")}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {Number(det.cantidad).toFixed(3)}{" "}
                            {det.lote.producto.unidad_medida.abreviatura}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDetailOpen(false)}
            >
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
