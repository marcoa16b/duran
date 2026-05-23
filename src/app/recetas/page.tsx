"use client";

import {
  CheckCircle2,
  Eye,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
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
import { ModalConfirmacion } from "@/components/ui/modal-confirmacion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type Column, TablaGenerica } from "@/components/ui/tabla-generica";
import { createRecetaSchema } from "@/lib/validations";
import z from "zod";

type CreateRecetaInput = z.infer<typeof createRecetaSchema>;
type IngredienteInput = z.infer<
  typeof createRecetaSchema
>["ingredientes"][number];

interface Receta {
  id: number;
  nombre: string;
  descripcion: string | null;
  producto_id: number;
  producto: { nombre: string };
  activo: boolean;
  _count?: { ingredientes: number };
}

interface ProductoCatalogo {
  id: number;
  nombre: string;
  categoria_producto: { id: number; nombre: string } | null;
}

interface RecetaDetalleIngrediente {
  id: number;
  producto_id: number;
  producto: { nombre: string; unidad_medida: { abreviatura: string } };
  cantidad: number;
}

interface RecetaDetalle {
  id: number;
  nombre: string;
  descripcion: string | null;
  producto: { nombre: string };
  ingredientes: RecetaDetalleIngrediente[];
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

export default function RecetasPage() {
  const [data, setData] = useState<Receta[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Receta | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Receta | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState<RecetaDetalle | null>(null);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [verifyRecetaId, setVerifyRecetaId] = useState<number | null>(null);
  const [verifyCantidad, setVerifyCantidad] = useState("");
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [productos, setProductos] = useState<ProductoCatalogo[]>([]);
  const [productosProduccion, setProductosProduccion] = useState<
    ProductoCatalogo[]
  >([]);
  const pageSize = 20;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<{ nombre: string; descripcion: string; producto_id: number }>();

  const watchProductoId = watch("producto_id");

  const [formIngredientes, setFormIngredientes] = useState<
    (IngredienteInput & { _key: number })[]
  >([{ _key: 0, producto_id: 0, cantidad: 0 }]);
  const nextIngKey = useRef(1);

  function addIngrediente() {
    const key = nextIngKey.current++;
    setFormIngredientes((prev) => [
      ...prev,
      { _key: key, producto_id: 0, cantidad: 0 },
    ]);
  }

  function removeIngrediente(index: number) {
    if (formIngredientes.length <= 1) return;
    setFormIngredientes((prev) => prev.filter((_, i) => i !== index));
  }

  function updateIngrediente(
    index: number,
    field: keyof IngredienteInput,
    value: number,
  ) {
    setFormIngredientes((prev) =>
      prev.map((ing, i) => (i === index ? { ...ing, [field]: value } : ing)),
    );
  }

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set("query", query);
      const res = await fetch(`/api/recetas?${params}`);
      const json = await res.json();
      const allData: Receta[] = json.data ?? [];
      setData(allData);
      setTotal(allData.length);
    } catch {
      toast.error("Error al cargar recetas");
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        const [catRes, prodRes] = await Promise.all([
          fetch("/api/catalogos/categorias"),
          fetch("/api/catalogos/productos"),
        ]);
        const cats = (await catRes.json()).data ?? [];
        const allProds: ProductoCatalogo[] = (await prodRes.json()).data ?? [];
        setProductos(allProds);

        const prod = cats.find(
          (c: { id: number; nombre: string }) =>
            c.nombre.toLowerCase() === "producción",
        );
        if (prod) {
          const filtered = allProds.filter(
            (p) => p.categoria_producto?.id === prod.id,
          );
          setProductosProduccion(filtered);
        }
      } catch {
        toast.error("Error al cargar catálogos");
      }
    };
    loadCatalogs();
  }, []);

  const start = (page - 1) * pageSize;
  const paginatedData = data.slice(start, start + pageSize);

  async function handleEditClick(r: Receta) {
    setEditing(r);
    reset({
      nombre: r.nombre,
      descripcion: r.descripcion ?? "",
      producto_id: r.producto_id,
    });
    try {
      const res = await fetch(`/api/recetas/${r.id}`);
      const json = await res.json();
      const detalle: RecetaDetalle = json.data;
      const ings = detalle.ingredientes.map((ing, i) => ({
        _key: i,
        producto_id: ing.producto_id,
        cantidad: Number(ing.cantidad),
      }));
      setFormIngredientes(
        ings.length ? ings : [{ _key: 0, producto_id: 0, cantidad: 0 }],
      );
      nextIngKey.current = ings.length;
    } catch {
      setFormIngredientes([{ _key: 0, producto_id: 0, cantidad: 0 }]);
    }
    setFormOpen(true);
  }

  function handleFormOpenChange(open: boolean) {
    if (!open) {
      setEditing(null);
      reset({ nombre: "", descripcion: "", producto_id: 0 });
      setFormIngredientes([{ _key: 0, producto_id: 0, cantidad: 0 }]);
      nextIngKey.current = 1;
    }
    setFormOpen(open);
  }

  async function onSubmit(formData: {
    nombre: string;
    descripcion: string;
    producto_id: number;
  }) {
    const payload: CreateRecetaInput = {
      nombre: formData.nombre,
      descripcion: formData.descripcion || undefined,
      producto_id: formData.producto_id,
      ingredientes: formIngredientes.filter((ing) => ing.producto_id > 0),
    };

    if (!payload.nombre) {
      toast.error("El nombre es requerido");
      return;
    }
    if (!payload.producto_id) {
      toast.error("Debe seleccionar un producto final");
      return;
    }
    if (!payload.ingredientes.length) {
      toast.error("Al menos un ingrediente requerido");
      return;
    }

    try {
      if (editing) {
        const res = await fetch(`/api/recetas/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre: payload.nombre,
            descripcion: payload.descripcion,
          }),
        });
        if (!res.ok)
          throw new Error((await res.json()).error ?? "Error al actualizar");

        const ingRes = await fetch(`/api/recetas/${editing.id}/ingredientes`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ingredientes: payload.ingredientes }),
        });
        if (!ingRes.ok)
          throw new Error(
            (await ingRes.json()).error ?? "Error al actualizar ingredientes",
          );

        toast.success("Receta actualizada");
      } else {
        const res = await fetch("/api/recetas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok)
          throw new Error((await res.json()).error ?? "Error al crear");
        toast.success("Receta creada");
      }
      handleFormOpenChange(false);
      fetchData();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al guardar");
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteConfirm) return;
    try {
      const res = await fetch(`/api/recetas/${deleteConfirm.id}`, {
        method: "DELETE",
      });
      if (!res.ok)
        throw new Error((await res.json()).error ?? "Error al desactivar");
      toast.success("Receta desactivada");
      setDeleteConfirm(null);
      fetchData();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al desactivar");
    }
  }

  async function handleViewDetail(r: Receta) {
    try {
      const res = await fetch(`/api/recetas/${r.id}`);
      const json = await res.json();
      setDetailData(json.data);
      setDetailOpen(true);
    } catch {
      toast.error("Error al cargar detalle");
    }
  }

  async function handleVerify(r: Receta) {
    setVerifyRecetaId(r.id);
    setVerifyCantidad("");
    setVerifyResult(null);
    setVerifyOpen(true);
  }

  async function runVerify() {
    if (!verifyRecetaId || !verifyCantidad) return;
    const cantidad = Number(verifyCantidad);
    if (cantidad <= 0) {
      toast.error("Cantidad inválida");
      return;
    }
    try {
      const res = await fetch(
        `/api/recetas/${verifyRecetaId}/verify?cantidad=${cantidad}`,
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error al verificar");
      setVerifyResult(json.data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al verificar");
    }
  }

  const columns: Column<Receta>[] = [
    { key: "nombre", header: "Nombre", render: (r) => r.nombre },
    {
      key: "producto",
      header: "Producto Final",
      render: (r) => r.producto.nombre,
    },
    {
      key: "ingredientes",
      header: "Ingredientes",
      render: (r) => (
        <Badge variant="secondary">{r._count?.ingredientes ?? 0}</Badge>
      ),
    },
    {
      key: "estado",
      header: "Estado",
      render: (r) =>
        r.activo ? (
          <Badge variant="secondary">Activa</Badge>
        ) : (
          <Badge variant="outline">Inactiva</Badge>
        ),
    },
    {
      key: "acciones",
      header: "Acciones",
      render: (r) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => handleViewDetail(r)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => handleEditClick(r)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => handleVerify(r)}
          >
            <CheckCircle2 className="h-4 w-4" />
          </Button>
          <Button
            variant="destructive"
            size="icon-sm"
            onClick={() => setDeleteConfirm(r)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Recetas</h1>
          <Button
            onClick={() => {
              setEditing(null);
              reset({ nombre: "", descripcion: "", producto_id: 0 });
              setFormIngredientes([{ _key: 0, producto_id: 0, cantidad: 0 }]);
              nextIngKey.current = 1;
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva Receta
          </Button>
        </div>

        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar recetas..."
            className="pl-9"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <TablaGenerica
          columns={columns}
          data={paginatedData}
          total={total}
          page={page}
          pageSize={pageSize}
          loading={loading}
          onPageChange={setPage}
        />
      </div>

      <Dialog open={formOpen} onOpenChange={handleFormOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar Receta" : "Nueva Receta"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="nombre">Nombre</Label>
              <Input id="nombre" {...register("nombre")} />
              {errors.nombre && (
                <p className="text-sm text-destructive mt-1">
                  {errors.nombre.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="descripcion">Descripción</Label>
              <textarea
                id="descripcion"
                className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none"
                {...register("descripcion")}
              />
            </div>
            <div>
              <Label>Producto Final</Label>
              <Select
                value={watchProductoId ? String(watchProductoId) : ""}
                onValueChange={(v) =>
                  setValue("producto_id", Number(v), {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar producto">
                    {(value: string | null) => {
                      if (!value) return "Seleccionar producto";
                      return (
                        productosProduccion.find((p) => String(p.id) === value)
                          ?.nombre ?? value
                      );
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {productosProduccion.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Solo productos de categoría Producción
              </p>
              {errors.producto_id && (
                <p className="text-sm text-destructive mt-1">
                  {errors.producto_id.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Ingredientes</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addIngrediente}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Agregar
                </Button>
              </div>
              {formIngredientes.map((ing, index) => (
                <div key={ing._key} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Select
                      value={ing.producto_id ? String(ing.producto_id) : ""}
                      onValueChange={(v) =>
                        updateIngrediente(index, "producto_id", Number(v))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleccionar producto">
                          {(value: string | null) => {
                            if (!value) return "Seleccionar producto";
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
                            {p.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-32">
                    <Input
                      type="number"
                      step="0.001"
                      placeholder="Cantidad"
                      value={ing.cantidad || ""}
                      onChange={(e) =>
                        updateIngrediente(
                          index,
                          "cantidad",
                          Number(e.target.value),
                        )
                      }
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="text-destructive"
                    disabled={formIngredientes.length <= 1}
                    onClick={() => removeIngrediente(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleFormOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {editing ? "Actualizar Receta" : "Crear Receta"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{detailData?.nombre}</DialogTitle>
          </DialogHeader>
          {detailData && (
            <div className="space-y-4">
              {detailData.descripcion && (
                <p className="text-sm text-muted-foreground">
                  {detailData.descripcion}
                </p>
              )}
              <hr className="border-border" />
              <div className="space-y-2">
                <p className="text-sm font-medium">Ingredientes:</p>
                {detailData.ingredientes.map((ing) => (
                  <div
                    key={ing.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="font-medium">{ing.producto.nombre}</span>
                    <div className="flex items-center gap-1">
                      <Badge variant="secondary">
                        {Number(ing.cantidad).toFixed(3)}
                      </Badge>
                      <span className="text-muted-foreground">
                        {ing.producto.unidad_medida.abreviatura}
                      </span>
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
              onClick={() => setDetailOpen(false)}
            >
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={verifyOpen} onOpenChange={setVerifyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verificar disponibilidad</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Verifica si hay insumos suficientes para producir esta receta.
            </p>
            <div className="flex gap-2 items-end">
              <div className="w-32">
                <Input
                  type="number"
                  step="1"
                  min="1"
                  placeholder="Cantidad"
                  value={verifyCantidad}
                  onChange={(e) => setVerifyCantidad(e.target.value)}
                />
              </div>
              <Button onClick={runVerify}>Verificar</Button>
            </div>
            {verifyResult && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {verifyResult.disponible ? (
                    <Badge
                      variant="secondary"
                      className="text-green-600 bg-green-100"
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
                      <span className="font-medium">
                        {item.producto_nombre}
                      </span>
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
                            className="text-green-600 bg-green-100 text-xs"
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
          </div>
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

      <ModalConfirmacion
        open={deleteConfirm !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirm(null);
        }}
        title="Desactivar receta"
        description={`¿Desactivar ${deleteConfirm?.nombre}? La receta se marcará como inactiva pero no se eliminará.`}
        variant="danger"
        confirmText="Desactivar"
        onConfirm={handleDeleteConfirm}
      />
    </DashboardLayout>
  );
}
