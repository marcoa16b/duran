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
import { createEntradaSchema, createProveedorSchema } from "@/lib/validations";
import z from "zod";

type CreateEntradaInput = z.infer<typeof createEntradaSchema>;
type CreateProveedorInput = z.infer<typeof createProveedorSchema>;

interface Entrada {
  id: number;
  fecha: string;
  tipo: { nombre: string };
  proveedor: { nombre: string } | null;
  _count: { lotes: number };
}

interface TipoCatalogo {
  id: number;
  nombre: string;
}

interface ProductoCatalogo {
  id: number;
  nombre: string;
  unidad_medida: { nombre: string };
}

interface ProveedorCatalogo {
  id: number;
  nombre: string;
}

interface EntradaDetalle {
  id: number;
  fecha: string;
  tipo: { id: number; nombre: string };
  proveedor: { id: number; nombre: string } | null;
  numero_factura: string | null;
  observaciones: string | null;
  lotes: Array<{
    id: number;
    cantidad: number;
    precio_unitario: number | null;
    fecha_vencimiento: string | null;
    codigo_lote: string | null;
    producto: { id: number; nombre: string; unidad_medida: { nombre: string } };
  }>;
}

const columns: Column<Entrada>[] = [
  {
    key: "fecha",
    header: "Fecha",
    render: (e) => format(new Date(e.fecha), "dd/MM/yyyy"),
  },
  { key: "tipo", header: "Tipo", render: (e) => e.tipo.nombre },
  {
    key: "proveedor",
    header: "Proveedor",
    render: (e) => e.proveedor?.nombre ?? "—",
  },
  { key: "lotes", header: "Lotes", render: (e) => String(e._count.lotes) },
  {
    key: "acciones",
    header: "Acciones",
    render: (_e) => (
      <Button variant="outline" size="sm">
        <Eye className="h-3 w-3 mr-1" />
        Ver
      </Button>
    ),
  },
];

export default function EntradasPage() {
  const [data, setData] = useState<Entrada[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState<EntradaDetalle | null>(null);
  const [fechaInicio, setFechaInicio] = useState(
    `${new Date().getFullYear()}-01-01`,
  );
  const [fechaFin, setFechaFin] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [fechaInicioApplied, setFechaInicioApplied] = useState(fechaInicio);
  const [fechaFinApplied, setFechaFinApplied] = useState(fechaFin);
  const [tipos, setTipos] = useState<TipoCatalogo[]>([]);
  const [proveedores, setProveedores] = useState<ProveedorCatalogo[]>([]);
  const [productos, setProductos] = useState<ProductoCatalogo[]>([]);
  const [proveedorDialogOpen, setProveedorDialogOpen] = useState(false);
  const [proveedorFormNombre, setProveedorFormNombre] = useState("");
  const [proveedorFormTelefono, setProveedorFormTelefono] = useState("");
  const [proveedorFormCorreo, setProveedorFormCorreo] = useState("");
  const [savingProveedor, setSavingProveedor] = useState(false);
  const pageSize = 20;

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    setValue,
    watch,
    reset,
  } = useForm<CreateEntradaInput>({
    resolver: zodResolver(createEntradaSchema),
    defaultValues: {
      tipo_id: 0,
      proveedor_id: undefined,
      fecha: new Date().toISOString().split("T")[0],
      numero_factura: "",
      observaciones: "",
      lotes: [],
    },
  });

  const {
    fields: loteFields,
    append: appendLote,
    remove: removeLote,
  } = useFieldArray({ control, name: "lotes" });

  const watchTipoId = watch("tipo_id");
  const watchProveedorId = watch("proveedor_id");
  const watchLotes = watch("lotes");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        offset: String((page - 1) * pageSize),
        limit: String(pageSize),
        fecha_inicio: new Date(fechaInicioApplied).toISOString(),
        fecha_fin: new Date(`${fechaFinApplied}T23:59:59`).toISOString(),
      });
      const res = await fetch(`/api/entradas?${params}`);
      const json = await res.json();
      setData(json.data ?? json);
      setTotal(json.total ?? (Array.isArray(json) ? json.length : 0));
    } catch {
      toast.error("Error al cargar entradas");
    } finally {
      setLoading(false);
    }
  }, [page, fechaInicioApplied, fechaFinApplied]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    Promise.all([
      fetch("/api/catalogos/tipos/entrada").then((r) => r.json()),
      fetch("/api/catalogos/proveedores").then((r) => r.json()),
      fetch("/api/catalogos/productos").then((r) => r.json()),
    ])
      .then(([t, p, pr]) => {
        setTipos(t.data ?? []);
        setProveedores(p.data ?? []);
        setProductos(pr.data ?? []);
      })
      .catch(() => toast.error("Error al cargar catálogos"));
  }, []);

  async function handleVerClick(entrada: Entrada) {
    try {
      const res = await fetch(`/api/entradas/${entrada.id}`);
      const json = await res.json();
      setDetailData(json);
      setDetailOpen(true);
    } catch {
      toast.error("Error al cargar detalle");
    }
  }

  const accionesColumn: Column<Entrada> = {
    key: "acciones",
    header: "Acciones",
    render: (e) => (
      <Button variant="outline" size="sm" onClick={() => handleVerClick(e)}>
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
        proveedor_id: undefined,
        fecha: new Date().toISOString().split("T")[0],
        numero_factura: "",
        observaciones: "",
        lotes: [],
      });
    }
    setFormOpen(open);
  }

  async function onSubmit(formData: CreateEntradaInput) {
    try {
      const body = {
        ...formData,
        tipo_id: Number(formData.tipo_id),
        proveedor_id: formData.proveedor_id
          ? Number(formData.proveedor_id)
          : undefined,
        lotes: formData.lotes.map((l: any) => ({
          ...l,
          producto_id: Number(l.producto_id),
          cantidad: Number(l.cantidad),
          precio_unitario: l.precio_unitario
            ? Number(l.precio_unitario)
            : undefined,
        })),
      };
      const res = await fetch("/api/entradas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Error al crear entrada");
      }
      toast.success("Entrada registrada");
      handleFormOpenChange(false);
      fetchData();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al guardar");
    }
  }

  async function handleCrearProveedorRapido() {
    if (!proveedorFormNombre.trim()) {
      toast.error("Nombre requerido");
      return;
    }
    setSavingProveedor(true);
    try {
      const body: CreateProveedorInput = {
        nombre: proveedorFormNombre.trim(),
        telefono: proveedorFormTelefono.trim() || undefined,
        correo: proveedorFormCorreo.trim() || undefined,
      };
      const parsed = createProveedorSchema.parse(body);
      const res = await fetch("/api/proveedores/rapido", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Error al crear proveedor");
      }
      const json = await res.json();
      const nuevo: ProveedorCatalogo = json.data;
      setProveedores((prev) => [...prev, nuevo]);
      setValue("proveedor_id", nuevo.id, { shouldValidate: true });
      setProveedorDialogOpen(false);
      setProveedorFormNombre("");
      setProveedorFormTelefono("");
      setProveedorFormCorreo("");
      toast.success("Proveedor creado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al crear proveedor");
    } finally {
      setSavingProveedor(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Entradas de Inventario</h1>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Entrada
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
        <DialogContent className="w-full! max-w-3xl! max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva Entrada</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label>Tipo de Entrada</Label>
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
              <Label>Proveedor</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Select
                    value={watchProveedorId ? String(watchProveedorId) : ""}
                    onValueChange={(v) =>
                      setValue("proveedor_id", v ? Number(v) : undefined, {
                        shouldValidate: true,
                      })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {(value: string | null) => {
                          if (!value) return "Seleccionar proveedor";
                          return (
                            proveedores.find((p) => String(p.id) === value)
                              ?.nombre ?? value
                          );
                        }}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {proveedores.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setProveedorDialogOpen(true)}
                  title="Nuevo proveedor"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
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
              <Label htmlFor="numero_factura">N° Factura</Label>
              <Input id="numero_factura" {...register("numero_factura")} />
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
                <Label>Lotes</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    appendLote({
                      producto_id: 0,
                      cantidad: 0,
                      precio_unitario: undefined,
                      fecha_vencimiento: "",
                      codigo_lote: "",
                    })
                  }
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar lote
                </Button>
              </div>
              {loteFields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex flex-wrap gap-2 items-end p-2 border rounded-md"
                >
                  <div className="flex-1 min-w-32">
                    <Label className="text-xs">Producto</Label>
                    <Select
                      value={
                        watchLotes?.[index]?.producto_id
                          ? String(watchLotes[index].producto_id)
                          : ""
                      }
                      onValueChange={(v) =>
                        setValue(
                          `lotes.${index}.producto_id` as `lotes.${number}.producto_id`,
                          v ? Number(v) : 0,
                          { shouldValidate: true },
                        )
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue>
                          {(value: string | null) => {
                            if (!value) return "Producto";
                            return (
                              productos.find((p) => String(p.id) === value)
                                ?.nombre ?? value
                            );
                          }}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {productos.map((p) => (
                          <SelectItem key={p.id} value={String(p.id)}>
                            {p.nombre} ({p.unidad_medida.nombre})
                          </SelectItem>
                        ))}
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
                        `lotes.${index}.cantidad` as `lotes.${number}.cantidad`,
                        {
                          valueAsNumber: true,
                        },
                      )}
                    />
                  </div>
                  <div className="w-28">
                    <Label className="text-xs">Vencimiento</Label>
                    <Input
                      type="date"
                      {...register(
                        `lotes.${index}.fecha_vencimiento` as `lotes.${number}.fecha_vencimiento`,
                      )}
                    />
                  </div>
                  <div className="w-24">
                    <Label className="text-xs">Precio unit.</Label>
                    <Input
                      type="number"
                      step="any"
                      min={0}
                      placeholder="0.00"
                      {...register(
                        `lotes.${index}.precio_unitario` as `lotes.${number}.precio_unitario`,
                        {
                          setValueAs: (v) =>
                            v === "" || v === undefined ? undefined : Number(v),
                        },
                      )}
                    />
                  </div>
                  <div className="w-28">
                    <Label className="text-xs">Código lote</Label>
                    <Input
                      placeholder="Opcional"
                      {...register(
                        `lotes.${index}.codigo_lote` as `lotes.${number}.codigo_lote`,
                      )}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon-sm"
                    onClick={() => removeLote(index)}
                    className="mb-0.5"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {errors.lotes?.message && (
                <p className="text-sm text-destructive">
                  {errors.lotes.message}
                </p>
              )}
              {errors.lotes?.root?.message && (
                <p className="text-sm text-destructive">
                  {errors.lotes.root.message}
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
              <Button type="submit">Registrar Entrada</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={proveedorDialogOpen} onOpenChange={setProveedorDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Proveedor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="prov-nombre">Nombre</Label>
              <Input
                id="prov-nombre"
                value={proveedorFormNombre}
                onChange={(e) => setProveedorFormNombre(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="prov-telefono">Teléfono</Label>
              <Input
                id="prov-telefono"
                value={proveedorFormTelefono}
                onChange={(e) => setProveedorFormTelefono(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="prov-correo">Correo</Label>
              <Input
                id="prov-correo"
                type="email"
                value={proveedorFormCorreo}
                onChange={(e) => setProveedorFormCorreo(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setProveedorDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleCrearProveedorRapido}
                disabled={savingProveedor}
              >
                {savingProveedor ? "Guardando..." : "Crear Proveedor"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle de Entrada</DialogTitle>
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
                <div>
                  <Label>Proveedor</Label>
                  <p className="text-sm">
                    {detailData.proveedor?.nombre ?? "—"}
                  </p>
                </div>
                <div>
                  <Label>N° Factura</Label>
                  <p className="text-sm">{detailData.numero_factura ?? "—"}</p>
                </div>
              </div>
              {detailData.observaciones && (
                <div>
                  <Label>Observaciones</Label>
                  <p className="text-sm">{detailData.observaciones}</p>
                </div>
              )}
              <div>
                <Label>Lotes</Label>
                <table className="w-full text-sm mt-1">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-1 pr-2">Producto</th>
                      <th className="py-1 pr-2">Cantidad</th>
                      <th className="py-1 pr-2">Código</th>
                      <th className="py-1 pr-2">Vencimiento</th>
                      <th className="py-1 pr-2">Precio unit.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailData.lotes.map((l) => (
                      <tr key={l.id} className="border-b last:border-0">
                        <td className="py-1 pr-2">{l.producto.nombre}</td>
                        <td className="py-1 pr-2">{l.cantidad}</td>
                        <td className="py-1 pr-2">{l.codigo_lote ?? "—"}</td>
                        <td className="py-1 pr-2">
                          {l.fecha_vencimiento
                            ? format(
                                new Date(l.fecha_vencimiento),
                                "dd/MM/yyyy",
                              )
                            : "—"}
                        </td>
                        <td className="py-1 pr-2">
                          {l.precio_unitario != null
                            ? `₡${Number(l.precio_unitario).toLocaleString()}`
                            : "—"}
                        </td>
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
