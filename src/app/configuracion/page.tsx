"use client";

import { KeyRound, Lock, Pencil, Plus, Save, Trash2, User } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ModalConfirmacion } from "@/components/ui/modal-confirmacion";
import { type Column, TablaGenerica } from "@/components/ui/tabla-generica";
import type {
  CategoriaInput,
  UnidadInput,
  UpdateProfileInput,
} from "@/lib/validations";
import { changePasswordSchema } from "@/lib/validations";

interface Categoria {
  id: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
}

interface Unidad {
  id: number;
  nombre: string;
  abreviatura: string;
  activo: boolean;
}

interface Perfil {
  id: number;
  nombre: string;
  correo: string;
  rol: { nombre: string };
}

export default function ConfiguracionPage() {
  const [tab, setTab] = useState<"categorias" | "unidades" | "perfil">(
    "categorias",
  );
  const [loading, setLoading] = useState(true);

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [unidades, setUnidades] = useState<Unidad[]>([]);
  const [perfil, setPerfil] = useState<Perfil | null>(null);

  const [catFormOpen, setCatFormOpen] = useState(false);
  const [catEditing, setCatEditing] = useState<Categoria | null>(null);
  const [catNombre, setCatNombre] = useState("");
  const [catDescripcion, setCatDescripcion] = useState("");
  const [catDelete, setCatDelete] = useState<Categoria | null>(null);
  const [catSaving, setCatSaving] = useState(false);

  const [uniFormOpen, setUniFormOpen] = useState(false);
  const [uniEditing, setUniEditing] = useState<Unidad | null>(null);
  const [uniNombre, setUniNombre] = useState("");
  const [uniAbreviatura, setUniAbreviatura] = useState("");
  const [uniDelete, setUniDelete] = useState<Unidad | null>(null);
  const [uniSaving, setUniSaving] = useState(false);

  const [perfilNombre, setPerfilNombre] = useState("");
  const [perfilCorreo, setPerfilCorreo] = useState("");
  const [perfilSaving, setPerfilSaving] = useState(false);

  const [pwOpen, setPwOpen] = useState(false);
  const [pwActual, setPwActual] = useState("");
  const [pwNueva, setPwNueva] = useState("");
  const [pwConfirmar, setPwConfirmar] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [catRes, uniRes] = await Promise.all([
        fetch("/api/config/categorias"),
        fetch("/api/config/unidades"),
      ]);
      setCategorias((await catRes.json()).data ?? []);
      setUnidades((await uniRes.json()).data ?? []);
    } catch {
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPerfil = useCallback(async () => {
    try {
      const res = await fetch("/api/config/perfil");
      const json = await res.json();
      if (json.data) {
        setPerfil(json.data);
        setPerfilNombre(json.data.nombre);
        setPerfilCorreo(json.data.correo);
      }
    } catch {
      toast.error("Error al cargar perfil");
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (tab === "perfil") fetchPerfil();
  }, [tab, fetchPerfil]);

  function openCatForm(cat?: Categoria) {
    setCatEditing(cat ?? null);
    setCatNombre(cat?.nombre ?? "");
    setCatDescripcion(cat?.descripcion ?? "");
    setCatFormOpen(true);
  }

  async function saveCategoria() {
    if (!catNombre.trim()) {
      toast.error("El nombre es requerido");
      return;
    }
    setCatSaving(true);
    try {
      const payload: CategoriaInput = {
        nombre: catNombre.trim(),
        descripcion: catDescripcion.trim() || undefined,
      };
      if (catEditing) {
        const res = await fetch(`/api/config/categorias/${catEditing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok)
          throw new Error((await res.json()).error ?? "Error al actualizar");
        toast.success("Categoría actualizada");
      } else {
        const res = await fetch("/api/config/categorias", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok)
          throw new Error((await res.json()).error ?? "Error al crear");
        toast.success("Categoría creada");
      }
      setCatFormOpen(false);
      fetchData();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setCatSaving(false);
    }
  }

  async function deleteCategoria() {
    if (!catDelete) return;
    try {
      const res = await fetch(`/api/config/categorias/${catDelete.id}`, {
        method: "DELETE",
      });
      if (!res.ok)
        throw new Error((await res.json()).error ?? "Error al desactivar");
      toast.success("Categoría desactivada");
      setCatDelete(null);
      fetchData();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al desactivar");
    }
  }

  function openUniForm(uni?: Unidad) {
    setUniEditing(uni ?? null);
    setUniNombre(uni?.nombre ?? "");
    setUniAbreviatura(uni?.abreviatura ?? "");
    setUniFormOpen(true);
  }

  async function saveUnidad() {
    if (!uniNombre.trim()) {
      toast.error("El nombre es requerido");
      return;
    }
    if (!uniAbreviatura.trim()) {
      toast.error("La abreviatura es requerida");
      return;
    }
    setUniSaving(true);
    try {
      const payload: UnidadInput = {
        nombre: uniNombre.trim(),
        abreviatura: uniAbreviatura.trim(),
      };
      if (uniEditing) {
        const res = await fetch(`/api/config/unidades/${uniEditing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok)
          throw new Error((await res.json()).error ?? "Error al actualizar");
        toast.success("Unidad actualizada");
      } else {
        const res = await fetch("/api/config/unidades", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok)
          throw new Error((await res.json()).error ?? "Error al crear");
        toast.success("Unidad creada");
      }
      setUniFormOpen(false);
      fetchData();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setUniSaving(false);
    }
  }

  async function deleteUnidad() {
    if (!uniDelete) return;
    try {
      const res = await fetch(`/api/config/unidades/${uniDelete.id}`, {
        method: "DELETE",
      });
      if (!res.ok)
        throw new Error((await res.json()).error ?? "Error al desactivar");
      toast.success("Unidad desactivada");
      setUniDelete(null);
      fetchData();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al desactivar");
    }
  }

  async function savePerfil() {
    if (!perfilNombre.trim()) {
      toast.error("El nombre es requerido");
      return;
    }
    if (!perfilCorreo.trim()) {
      toast.error("El correo es requerido");
      return;
    }
    setPerfilSaving(true);
    try {
      const payload: UpdateProfileInput = {
        nombre: perfilNombre.trim(),
        correo: perfilCorreo.trim(),
      };
      const res = await fetch("/api/config/perfil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok)
        throw new Error((await res.json()).error ?? "Error al guardar perfil");
      toast.success("Perfil actualizado");
      fetchPerfil();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setPerfilSaving(false);
    }
  }

  async function changePassword() {
    const result = changePasswordSchema.safeParse({
      contrasena_actual: pwActual,
      contrasena_nueva: pwNueva,
      confirmar_contrasena: pwConfirmar,
    });
    if (!result.success) {
      const first = result.error.errors[0];
      toast.error(first.message);
      return;
    }
    setPwSaving(true);
    try {
      const res = await fetch("/api/config/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });
      if (!res.ok)
        throw new Error(
          (await res.json()).error ?? "Error al cambiar contraseña",
        );
      toast.success("Contraseña cambiada exitosamente");
      setPwOpen(false);
      setPwActual("");
      setPwNueva("");
      setPwConfirmar("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al cambiar");
    } finally {
      setPwSaving(false);
    }
  }

  const catColumns: Column<Categoria>[] = [
    { key: "nombre", header: "Nombre", render: (c) => c.nombre },
    {
      key: "descripcion",
      header: "Descripción",
      render: (c) => c.descripcion ?? "—",
    },
    {
      key: "estado",
      header: "Estado",
      render: (c) =>
        c.activo ? (
          <Badge variant="secondary">Activa</Badge>
        ) : (
          <Badge variant="outline">Inactiva</Badge>
        ),
    },
    {
      key: "acciones",
      header: "Acciones",
      render: (c) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => openCatForm(c)}
          >
            <Pencil className="h-3 w-3" />
          </Button>
          {c.activo && (
            <Button
              variant="destructive"
              size="icon-sm"
              onClick={() => setCatDelete(c)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const uniColumns: Column<Unidad>[] = [
    { key: "nombre", header: "Nombre", render: (u) => u.nombre },
    {
      key: "abreviatura",
      header: "Abreviatura",
      render: (u) => u.abreviatura,
    },
    {
      key: "estado",
      header: "Estado",
      render: (u) =>
        u.activo ? (
          <Badge variant="secondary">Activa</Badge>
        ) : (
          <Badge variant="outline">Inactiva</Badge>
        ),
    },
    {
      key: "acciones",
      header: "Acciones",
      render: (u) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => openUniForm(u)}
          >
            <Pencil className="h-3 w-3" />
          </Button>
          {u.activo && (
            <Button
              variant="destructive"
              size="icon-sm"
              onClick={() => setUniDelete(u)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Configuración</h1>

        <div className="flex gap-2 border-b pb-2">
          <Button
            variant={tab === "categorias" ? "default" : "outline"}
            size="sm"
            onClick={() => setTab("categorias")}
          >
            Categorías
          </Button>
          <Button
            variant={tab === "unidades" ? "default" : "outline"}
            size="sm"
            onClick={() => setTab("unidades")}
          >
            Unidades
          </Button>
          <Button
            variant={tab === "perfil" ? "default" : "outline"}
            size="sm"
            onClick={() => setTab("perfil")}
          >
            Mi Perfil
          </Button>
        </div>

        {tab === "categorias" && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => openCatForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Categoría
              </Button>
            </div>
            <TablaGenerica
              columns={catColumns}
              data={categorias}
              total={categorias.length}
              page={1}
              pageSize={100}
              loading={loading}
              onPageChange={() => {}}
            />
          </div>
        )}

        {tab === "unidades" && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => openUniForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Unidad
              </Button>
            </div>
            <TablaGenerica
              columns={uniColumns}
              data={unidades}
              total={unidades.length}
              page={1}
              pageSize={100}
              loading={loading}
              onPageChange={() => {}}
            />
          </div>
        )}

        {tab === "perfil" && perfil && (
          <div className="max-w-lg space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="h-4 w-4" />
                  Información personal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input
                    id="nombre"
                    value={perfilNombre}
                    onChange={(e) => setPerfilNombre(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="correo">Correo</Label>
                  <Input
                    id="correo"
                    type="email"
                    value={perfilCorreo}
                    onChange={(e) => setPerfilCorreo(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Rol</Label>
                  <p className="text-sm text-muted-foreground">
                    {perfil.rol.nombre}
                  </p>
                </div>
                <Button onClick={savePerfil} disabled={perfilSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  {perfilSaving ? "Guardando..." : "Guardar cambios"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Lock className="h-4 w-4" />
                  Seguridad
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Cambia tu contraseña de acceso periódicamente para mantener tu
                  cuenta segura.
                </p>
                <Button variant="outline" onClick={() => setPwOpen(true)}>
                  <KeyRound className="h-4 w-4 mr-2" />
                  Cambiar contraseña
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <Dialog
        open={catFormOpen}
        onOpenChange={(o) => {
          if (!o) {
            setCatFormOpen(false);
            setCatEditing(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {catEditing ? "Editar Categoría" : "Nueva Categoría"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="catNombre">Nombre</Label>
              <Input
                id="catNombre"
                value={catNombre}
                onChange={(e) => setCatNombre(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="catDescripcion">Descripción</Label>
              <textarea
                id="catDescripcion"
                className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none"
                value={catDescripcion}
                onChange={(e) => setCatDescripcion(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCatFormOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={saveCategoria} disabled={catSaving}>
                {catSaving
                  ? "Guardando..."
                  : catEditing
                    ? "Actualizar"
                    : "Crear"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={uniFormOpen}
        onOpenChange={(o) => {
          if (!o) {
            setUniFormOpen(false);
            setUniEditing(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {uniEditing ? "Editar Unidad" : "Nueva Unidad"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="uniNombre">Nombre</Label>
              <Input
                id="uniNombre"
                value={uniNombre}
                onChange={(e) => setUniNombre(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="uniAbreviatura">Abreviatura</Label>
              <Input
                id="uniAbreviatura"
                className="w-32"
                value={uniAbreviatura}
                onChange={(e) => setUniAbreviatura(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setUniFormOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={saveUnidad} disabled={uniSaving}>
                {uniSaving
                  ? "Guardando..."
                  : uniEditing
                    ? "Actualizar"
                    : "Crear"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={pwOpen}
        onOpenChange={(o) => {
          if (!o) {
            setPwOpen(false);
            setPwActual("");
            setPwNueva("");
            setPwConfirmar("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar contraseña</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="pwActual">Contraseña actual</Label>
              <Input
                id="pwActual"
                type="password"
                value={pwActual}
                onChange={(e) => setPwActual(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="pwNueva">Nueva contraseña</Label>
              <Input
                id="pwNueva"
                type="password"
                value={pwNueva}
                onChange={(e) => setPwNueva(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="pwConfirmar">Confirmar nueva contraseña</Label>
              <Input
                id="pwConfirmar"
                type="password"
                value={pwConfirmar}
                onChange={(e) => setPwConfirmar(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setPwOpen(false);
                  setPwActual("");
                  setPwNueva("");
                  setPwConfirmar("");
                }}
              >
                Cancelar
              </Button>
              <Button onClick={changePassword} disabled={pwSaving}>
                {pwSaving ? "Cambiando..." : "Cambiar contraseña"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ModalConfirmacion
        open={catDelete !== null}
        onOpenChange={(o) => {
          if (!o) setCatDelete(null);
        }}
        title="Desactivar categoría"
        description={`¿Desactivar ${catDelete?.nombre}? La categoría se marcará como inactiva pero no se eliminará.`}
        variant="danger"
        confirmText="Desactivar"
        onConfirm={deleteCategoria}
      />

      <ModalConfirmacion
        open={uniDelete !== null}
        onOpenChange={(o) => {
          if (!o) setUniDelete(null);
        }}
        title="Desactivar unidad"
        description={`¿Desactivar ${uniDelete?.nombre}? La unidad se marcará como inactiva pero no se eliminará.`}
        variant="danger"
        confirmText="Desactivar"
        onConfirm={deleteUnidad}
      />
    </DashboardLayout>
  );
}
