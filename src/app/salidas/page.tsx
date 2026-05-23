"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Eye, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
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
import { createSalidaSchema } from "@/lib/validations";
import z from "zod";

type CreateSalidaInput = z.infer<typeof createSalidaSchema>;

interface Salida {
  id: number;
  fecha: string;
  tipo: { nombre: string };
  _count: { detalles: number };
}

interface TipoCatalogo {
  id: number;
  nombre: string;
}

interface LoteDisponible {
  id: number;
  codigo_lote: string | null;
  stock_disponible: number;
  producto: { id: number; nombre: string; unidad_medida: { nombre: string } };
}

interface SalidaDetalle {
  id: number;
  fecha: string;
  tipo: { id: number; nombre: string };
  observaciones: string | null;
  detalles: Array<{
    id: number;
    cantidad: number;
    motivo: string | null;
    lote: {
      id: number;
      codigo_lote: string | null;
      producto: {
        id: number;
        nombre: string;
        unidad_medida: { nombre: string };
      };
    };
  }>;
}

const columns: Column<Salida>[] = [
  {
    key: "fecha",
    header: "Fecha",
    render: (s) => format(new Date(s.fecha), "dd/MM/yyyy"),
  },
  { key: "tipo", header: "Tipo", render: (s) => s.tipo.nombre },
  {
    key: "detalles",
    header: "Detalles",
    render: (s) => String(s._count.detalles),
  },
  {
    key: "acciones",
    header: "Acciones",
    render: (_s) => (
      <Button variant="outline" size="sm">
        <Eye className="h-3 w-3 mr-1" />
        Ver
      </Button>
    ),
  },
];

export default function SalidasPage() {
  const [data, setData] = useState<Salida[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState<SalidaDetalle | null>(null);
  const [fechaInicio, setFechaInicio] = useState(
    `${new Date().getFullYear()}-01-01`,
  );
  const [fechaFin, setFechaFin] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [fechaInicioApplied, setFechaInicioApplied] = useState(fechaInicio);
  const [fechaFinApplied, setFechaFinApplied] = useState(fechaFin);
  const [tipos, setTipos] = useState<TipoCatalogo[]>([]);
  const [lotesDisponibles, setLotesDisponibles] = useState<LoteDisponible[]>(
    [],
  );
  const pageSize = 20;

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    setValue,
    watch,
    reset,
  } = useForm<CreateSalidaInput>({
    resolver: zodResolver(createSalidaSchema),
    defaultValues: {
      tipo_id: 0,
      fecha: new Date().toISOString().split("T")[0],
      observaciones: "",
      detalles: [],
    },
  });

  const {
    fields: detalleFields,
    append: appendDetalle,
    remove: removeDetalle,
  } = useFieldArray({ control, name: "detalles" });

  const watchTipoId = watch("tipo_id");
  const watchDetalles = watch("detalles");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        offset: String((page - 1) * pageSize),
        limit: String(pageSize),
        fecha_inicio: new Date(fechaInicioApplied).toISOString(),
        fecha_fin: new Date(`${fechaFinApplied}T23:59:59`).toISOString(),
      });
      const res = await fetch(`/api/salidas?${params}`);
      const json = await res.json();
      setData(json.data ?? json);
      setTotal(json.total ?? (Array.isArray(json) ? json.length : 0));
    } catch {
      toast.error("Error al cargar salidas");
    } finally {
      setLoading(false);
    }
  }, [page, fechaInicioApplied, fechaFinApplied]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    Promise.all([
      fetch("/api/catalogos/tipos/salida").then((r) => r.json()),
      fetch("/api/catalogos/lotes-disponibles").then((r) => r.json()),
    ])
      .then(([t, l]) => {
        setTipos(t.data ?? []);
        setLotesDisponibles(l.data ?? []);
      })
      .catch(() => toast.error("Error al cargar catálogos"));
  }, []);

  async function handleVerClick(salida: Salida) {
    try {
      const res = await fetch(`/api/salidas/${salida.id}`);
      const json = await res.json();
      setDetailData(json);
      setDetailOpen(true);
    } catch {
      toast.error("Error al cargar detalle");
    }
  }

  const accionesColumn: Column<Salida> = {
    key: "acciones",
    header: "Acciones",
    render: (s) => (
      <Button variant="outline" size="sm" onClick={() => handleVerClick(s)}>
        <Eye className="h-3 w-3 mr-1" />
        Ver
      </Button>
    ),
  };
  const fullColumns = [...columns.slice(0, -1), accionesColumn];

  function handleFormOpenChange(open: boolean) {
    if (!open) {
      reset({
        tipo_id: 0,
        fecha: new Date().toISOString().split("T")[0],
        observaciones: "",
        detalles: [],
      });
    }
    setFormOpen(open);
  }

  async function onSubmit(formData: CreateSalidaInput) {
    try {
      const body = {
        ...formData,
        tipo_id: Number(formData.tipo_id),
        detalles: formData.detalles.map((d: any) => ({
          ...d,
          lote_id: Number(d.lote_id),
          cantidad: Number(d.cantidad),
        })),
      };
      const res = await fetch("/api/salidas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Error al crear salida");
      }
      toast.success("Salida registrada");
      handleFormOpenChange(false);
      fetchData();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al guardar");
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Salidas de Inventario</h1>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Salida
          </Button>
        </div>

        <div className="flex items-end gap-2">
          <div>
            <Label htmlFor="fi">Desde</Label>
            <Input
              id="fi"
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="ff">Hasta</Label>
            <Input
              id="ff"
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setPage(1);
              setFechaInicioApplied(fechaInicio);
              setFechaFinApplied(fechaFin);
            }}
          >
            Filtrar
          </Button>
        </div>

        <TablaGenerica
          columns={fullColumns}
          data={data}
          total={total}
          page={page}
          pageSize={pageSize}
          loading={loading}
          onPageChange={setPage}
        />
      </div>

      <Dialog open={formOpen} onOpenChange={handleFormOpenChange}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva Salida</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label>Tipo de Salida</Label>
              <Select
                value={watchTipoId ? String(watchTipoId) : ""}
                onValueChange={(v) =>
                  setValue("tipo_id", v ? Number(v) : 0, {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {(value: string | null) => {
                      if (!value) return "Seleccionar tipo";
                      return (
                        tipos.find((t) => String(t.id) === value)?.nombre ??
                        value
                      );
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {tipos.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.tipo_id && (
                <p className="text-sm text-destructive mt-1">
                  {errors.tipo_id.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="fecha">Fecha</Label>
              <Input id="fecha" type="date" {...register("fecha")} />
              {errors.fecha && (
                <p className="text-sm text-destructive mt-1">
                  {errors.fecha.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="observaciones">Observaciones</Label>
              <textarea
                id="observaciones"
                className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none"
                {...register("observaciones")}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Detalles</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    appendDetalle({ lote_id: 0, cantidad: 0, motivo: "" })
                  }
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar detalle
                </Button>
              </div>
              {detalleFields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex flex-wrap gap-2 items-end p-2 border rounded-md"
                >
                  <div className="flex-1 min-w-32">
                    <Label className="text-xs">Lote</Label>
                    <Select
                      value={
                        watchDetalles?.[index]?.lote_id
                          ? String(watchDetalles[index].lote_id)
                          : ""
                      }
                      onValueChange={(v) =>
                        setValue(
                          `detalles.${index}.lote_id` as `detalles.${number}.lote_id`,
                          v ? Number(v) : 0,
                          { shouldValidate: true },
                        )
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue>
                          {(value: string | null) => {
                            if (!value) return "Seleccionar lote";
                            const lote = lotesDisponibles.find(
                              (l) => String(l.id) === value,
                            );
                            if (!lote) return value;
                            const label =
                              lote.codigo_lote ?? `Lote #${lote.id}`;
                            return `${label} (${lote.stock_disponible}) - ${lote.producto.nombre}`;
                          }}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {lotesDisponibles.map((l) => {
                          const label = l.codigo_lote ?? `Lote #${l.id}`;
                          return (
                            <SelectItem key={l.id} value={String(l.id)}>
                              {label} ({l.stock_disponible}) -{" "}
                              {l.producto.nombre}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-20">
                    <Label className="text-xs">Cant.</Label>
                    <Input
                      type="number"
                      step="any"
                      min={0}
                      {...register(
                        `detalles.${index}.cantidad` as `detalles.${number}.cantidad`,
                        { valueAsNumber: true },
                      )}
                    />
                  </div>
                  <div className="w-32">
                    <Label className="text-xs">Motivo</Label>
                    <Input
                      placeholder="Opcional"
                      {...register(
                        `detalles.${index}.motivo` as `detalles.${number}.motivo`,
                      )}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon-sm"
                    onClick={() => removeDetalle(index)}
                    className="mb-0.5"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {errors.detalles?.message && (
                <p className="text-sm text-destructive">
                  {errors.detalles.message}
                </p>
              )}
              {errors.detalles?.root?.message && (
                <p className="text-sm text-destructive">
                  {errors.detalles.root.message}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleFormOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">Registrar Salida</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle de Salida</DialogTitle>
          </DialogHeader>
          {detailData && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Fecha</Label>
                  <p className="text-sm">
                    {format(new Date(detailData.fecha), "dd/MM/yyyy")}
                  </p>
                </div>
                <div>
                  <Label>Tipo</Label>
                  <p className="text-sm">{detailData.tipo.nombre}</p>
                </div>
              </div>
              {detailData.observaciones && (
                <div>
                  <Label>Observaciones</Label>
                  <p className="text-sm">{detailData.observaciones}</p>
                </div>
              )}
              <div>
                <Label>Detalles</Label>
                <table className="w-full text-sm mt-1">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-1 pr-2">Lote</th>
                      <th className="py-1 pr-2">Producto</th>
                      <th className="py-1 pr-2">Cantidad</th>
                      <th className="py-1 pr-2">Motivo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailData.detalles.map((d) => (
                      <tr key={d.id} className="border-b last:border-0">
                        <td className="py-1 pr-2">
                          {d.lote.codigo_lote ?? `Lote #${d.lote.id}`}
                        </td>
                        <td className="py-1 pr-2">{d.lote.producto.nombre}</td>
                        <td className="py-1 pr-2">{d.cantidad}</td>
                        <td className="py-1 pr-2">{d.motivo ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDetailOpen(false)}
                >
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
