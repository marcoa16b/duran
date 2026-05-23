"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type z from "zod";
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
import { createProductoSchema } from "@/lib/validations";

type createProductoInput = z.infer<typeof createProductoSchema>;

interface Producto {
  id: number;
  nombre: string;
  descripcion: string | null;
  categoria_id: number;
  categoria_producto: { id: number; nombre: string };
  unidad_medida_id: number;
  unidad_medida: { id: number; abreviatura: string };
  stock_minimo: number;
  stock_actual: number;
  ubicacion: string | null;
  activo: boolean;
}

interface Categoria {
  id: number;
  nombre: string;
}

interface Unidad {
  id: number;
  nombre: string;
  abreviatura: string;
}

export default function ProductosPage() {
  const [data, setData] = useState<Producto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Producto | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Producto | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [unidades, setUnidades] = useState<Unidad[]>([]);
  const [categoriaFilter, setCategoriaFilter] = useState("all");
  const pageSize = 20;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<createProductoInput>({
    resolver: zodResolver(createProductoSchema),
    defaultValues: { stock_minimo: 0 },
  });

  const watchCategoriaId = watch("categoria_id");
  const watchUnidadId = watch("unidad_medida_id");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
      });
      if (query) params.set("q", query);
      if (categoriaFilter && categoriaFilter !== "all") {
        params.set("categoria_id", categoriaFilter);
      }
      const res = await fetch(`/api/productos?${params}`);
      const json = await res.json();
      setData(json.data);
      setTotal(json.total);
    } catch {
      toast.error("Error al cargar productos");
    } finally {
      setLoading(false);
    }
  }, [page, query, categoriaFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    Promise.all([
      fetch("/api/catalogos/categorias").then((r) => r.json()),
      fetch("/api/catalogos/unidades").then((r) => r.json()),
    ])
      .then(([catRes, uniRes]) => {
        setCategorias(catRes.data);
        setUnidades(uniRes.data);
      })
      .catch(() => toast.error("Error al cargar catálogos"));
  }, []);

  function handleEditClick(p: Producto) {
    setEditing(p);
    reset({
      nombre: p.nombre,
      descripcion: p.descripcion ?? "",
      categoria_id: p.categoria_id,
      unidad_medida_id: p.unidad_medida_id,
      stock_minimo: Number(p.stock_minimo),
      ubicacion: p.ubicacion ?? "",
    });
    setFormOpen(true);
  }

  function handleFormOpenChange(open: boolean) {
    if (!open) {
      setEditing(null);
      reset({ stock_minimo: 0 });
    }
    setFormOpen(open);
  }

  async function onSubmit(formData: createProductoInput) {
    try {
      if (editing) {
        const res = await fetch(`/api/productos/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (!res.ok)
          throw new Error((await res.json()).error ?? "Error al actualizar");
        toast.success("Producto actualizado");
      } else {
        const res = await fetch("/api/productos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (!res.ok)
          throw new Error((await res.json()).error ?? "Error al crear");
        toast.success("Producto creado");
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
      const res = await fetch(`/api/productos/${deleteConfirm.id}`, {
        method: "DELETE",
      });
      if (!res.ok)
        throw new Error((await res.json()).error ?? "Error al desactivar");
      toast.success("Producto desactivado");
      setDeleteConfirm(null);
      fetchData();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al desactivar");
    }
  }

  function isBelowMin(p: Producto) {
    return Number(p.stock_actual) <= Number(p.stock_minimo);
  }

  const columns: Column<Producto>[] = [
    { key: "nombre", header: "Nombre", render: (p) => p.nombre },
    {
      key: "categoria",
      header: "Categoría",
      render: (p) => p.categoria_producto.nombre,
    },
    {
      key: "unidad",
      header: "Unidad",
      render: (p) => p.unidad_medida.abreviatura,
    },
    {
      key: "stock_actual",
      header: "Stock Actual",
      render: (p) => (
        <Badge variant={isBelowMin(p) ? "destructive" : "secondary"}>
          {Number(p.stock_actual).toFixed(3)}
        </Badge>
      ),
    },
    {
      key: "stock_minimo",
      header: "Stock Mínimo",
      render: (p) => Number(p.stock_minimo).toFixed(3),
    },
    {
      key: "ubicacion",
      header: "Ubicación",
      render: (p) => p.ubicacion ?? "—",
    },
    {
      key: "acciones",
      header: "Acciones",
      render: (p) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => handleEditClick(p)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="destructive"
            size="icon-sm"
            onClick={() => setDeleteConfirm(p)}
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
          <h1 className="text-2xl font-bold">Productos</h1>
          <Button
            onClick={() => {
              setEditing(null);
              reset({ stock_minimo: 0 });
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Producto
          </Button>
        </div>

        <div className="flex gap-4 items-end">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar productos..."
              className="pl-9"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="w-48">
            <Select
              value={categoriaFilter}
              onValueChange={(v) => {
                setCategoriaFilter(v as string);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Todas las categorías">
                  {(value: string | null) => {
                    if (!value || value === "all") return "Todas";
                    return (
                      categorias.find((c) => String(c.id) === value)?.nombre ??
                      value
                    );
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {categorias.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <TablaGenerica
          columns={columns}
          data={data}
          total={total}
          page={page}
          pageSize={pageSize}
          loading={loading}
          onPageChange={setPage}
        />
      </div>

      <Dialog open={formOpen} onOpenChange={handleFormOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar Producto" : "Nuevo Producto"}
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
              <Label>Categoría</Label>
              <Select
                value={watchCategoriaId ? String(watchCategoriaId) : ""}
                onValueChange={(v) =>
                  setValue("categoria_id", Number(v), {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar categoría">
                    {(value: string | null) => {
                      if (!value) return "Seleccionar categoría";
                      return (
                        categorias.find((c) => String(c.id) === value)
                          ?.nombre ?? value
                      );
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.categoria_id && (
                <p className="text-sm text-destructive mt-1">
                  {errors.categoria_id.message}
                </p>
              )}
            </div>
            <div>
              <Label>Unidad de Medida</Label>
              <Select
                value={watchUnidadId ? String(watchUnidadId) : ""}
                onValueChange={(v) =>
                  setValue("unidad_medida_id", Number(v), {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar unidad">
                    {(value: string | null) => {
                      if (!value) return "Seleccionar unidad";
                      const u = unidades.find((u) => String(u.id) === value);
                      return u ? `${u.nombre} (${u.abreviatura})` : value;
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {unidades.map((u) => (
                    <SelectItem key={u.id} value={String(u.id)}>
                      {u.nombre} ({u.abreviatura})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.unidad_medida_id && (
                <p className="text-sm text-destructive mt-1">
                  {errors.unidad_medida_id.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="stock_minimo">Stock Mínimo</Label>
              <Input
                id="stock_minimo"
                type="number"
                step="0.001"
                {...register("stock_minimo", { valueAsNumber: true })}
              />
              {errors.stock_minimo && (
                <p className="text-sm text-destructive mt-1">
                  {errors.stock_minimo.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="ubicacion">Ubicación</Label>
              <Input id="ubicacion" {...register("ubicacion")} />
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
                {editing ? "Actualizar Producto" : "Crear Producto"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ModalConfirmacion
        open={deleteConfirm !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirm(null);
        }}
        title="Desactivar Producto"
        description={`¿Desactivar ${deleteConfirm?.nombre}? El producto se marcará como inactivo pero no se eliminará.`}
        variant="danger"
        confirmText="Desactivar"
        onConfirm={handleDeleteConfirm}
      />
    </DashboardLayout>
  );
}
