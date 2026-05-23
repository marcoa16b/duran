"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
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
import { ModalConfirmacion } from "@/components/ui/modal-confirmacion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type Column, TablaGenerica } from "@/components/ui/tabla-generica";
import type { CreateProveedorInput } from "@/lib/validations";
import { createProveedorSchema } from "@/lib/validations";

type ProveedorFormData = CreateProveedorInput;

interface Proveedor {
  id: number;
  nombre: string;
  telefono: string | null;
  correo: string | null;
  distrito_id: number | null;
  distrito: { id: number; nombre: string } | null;
  direccion_exacta: string | null;
  notas: string | null;
}

interface DistritoCatalogo {
  id: number;
  nombre: string;
}

export default function ProveedoresPage() {
  const [data, setData] = useState<Proveedor[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Proveedor | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Proveedor | null>(null);
  const [distritos, setDistritos] = useState<DistritoCatalogo[]>([]);
  const pageSize = 20;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<ProveedorFormData>({
    resolver: zodResolver(createProveedorSchema),
  });

  const watchDistritoId = watch("distrito_id");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        offset: String((page - 1) * pageSize),
        limit: String(pageSize),
      });
      if (query) params.set("query", query);
      const res = await fetch(`/api/proveedores?${params}`);
      const json = await res.json();
      setData(json.data);
      setTotal(json.total);
    } catch {
      toast.error("Error al cargar proveedores");
    } finally {
      setLoading(false);
    }
  }, [page, query]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetch("/api/catalogos/distritos")
      .then((r) => r.json())
      .then((json) => setDistritos(json.data))
      .catch(() => toast.error("Error al cargar distritos"));
  }, []);

  function handleEditClick(p: Proveedor) {
    setEditing(p);
    reset({
      nombre: p.nombre,
      telefono: p.telefono ?? undefined,
      correo: p.correo ?? undefined,
      distrito_id: p.distrito_id ?? undefined,
      direccion_exacta: p.direccion_exacta ?? undefined,
      notas: p.notas ?? undefined,
    });
    setFormOpen(true);
  }

  function handleFormOpenChange(open: boolean) {
    if (!open) {
      setEditing(null);
      reset({});
    }
    setFormOpen(open);
  }

  async function onSubmit(formData: ProveedorFormData) {
    try {
      if (editing) {
        const res = await fetch(`/api/proveedores/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (!res.ok)
          throw new Error((await res.json()).error ?? "Error al actualizar");
        toast.success("Proveedor actualizado");
      } else {
        const res = await fetch("/api/proveedores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (!res.ok)
          throw new Error((await res.json()).error ?? "Error al crear");
        toast.success("Proveedor creado");
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
      const res = await fetch(`/api/proveedores/${deleteConfirm.id}`, {
        method: "DELETE",
      });
      if (!res.ok)
        throw new Error((await res.json()).error ?? "Error al desactivar");
      toast.success("Proveedor desactivado");
      setDeleteConfirm(null);
      fetchData();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al desactivar");
    }
  }

  const columns: Column<Proveedor>[] = [
    { key: "nombre", header: "Nombre", render: (p) => p.nombre },
    { key: "telefono", header: "Teléfono", render: (p) => p.telefono ?? "—" },
    { key: "correo", header: "Correo", render: (p) => p.correo ?? "—" },
    {
      key: "direccion",
      header: "Dirección",
      render: (p) => {
        const dir = p.direccion_exacta ?? "";
        const dist = p.distrito?.nombre ?? "";
        return [dir, dist].filter(Boolean).join(", ") || "—";
      },
    },
    {
      key: "notas",
      header: "Notas",
      render: (p) =>
        p.notas ? (
          <span className="block max-w-50 truncate" title={p.notas}>
            {p.notas}
          </span>
        ) : (
          "—"
        ),
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
          <h1 className="text-2xl font-bold">Proveedores</h1>
          <Button
            onClick={() => {
              setEditing(null);
              reset({});
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Proveedor
          </Button>
        </div>

        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar proveedores..."
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
              {editing ? "Editar Proveedor" : "Nuevo Proveedor"}
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
              <Label htmlFor="telefono">Teléfono</Label>
              <Input id="telefono" {...register("telefono")} />
            </div>
            <div>
              <Label htmlFor="correo">Correo</Label>
              <Input id="correo" type="email" {...register("correo")} />
              {errors.correo && (
                <p className="text-sm text-destructive mt-1">
                  {errors.correo.message}
                </p>
              )}
            </div>
            <div>
              <Label>Distrito</Label>
              <Select
                value={watchDistritoId ? String(watchDistritoId) : ""}
                onValueChange={(v) =>
                  setValue("distrito_id", v ? Number(v) : undefined, {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar distrito">
                    {(value: string | null) => {
                      if (!value) return "Seleccionar distrito";
                      return (
                        distritos.find((d) => String(d.id) === value)?.nombre ??
                        value
                      );
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {distritos.map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>
                      {d.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.distrito_id && (
                <p className="text-sm text-destructive mt-1">
                  {errors.distrito_id.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="direccion_exacta">Dirección Exacta</Label>
              <textarea
                id="direccion_exacta"
                className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none"
                {...register("direccion_exacta")}
              />
            </div>
            <div>
              <Label htmlFor="notas">Notas</Label>
              <textarea
                id="notas"
                className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none"
                {...register("notas")}
              />
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
                {editing ? "Actualizar Proveedor" : "Crear Proveedor"}
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
        title="Desactivar Proveedor"
        description={`¿Desactivar ${deleteConfirm?.nombre}? El proveedor se marcará como inactivo pero no se eliminará.`}
        variant="danger"
        confirmText="Desactivar"
        onConfirm={handleDeleteConfirm}
      />
    </DashboardLayout>
  );
}
