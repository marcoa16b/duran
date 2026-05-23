"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type Column, TablaGenerica } from "@/components/ui/tabla-generica";

interface Categoria {
  id: number;
  nombre: string;
  descripcion: string | null;
}

interface Unidad {
  id: number;
  nombre: string;
  abreviatura: string;
}

export default function ConfiguracionPage() {
  const [tab, setTab] = useState<"categorias" | "unidades" | "perfil">(
    "categorias",
  );
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [unidades, setUnidades] = useState<Unidad[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [catRes, uniRes] = await Promise.all([
        fetch("/api/catalogos/categorias"),
        fetch("/api/catalogos/unidades"),
      ]);
      const catJson = await catRes.json();
      const uniJson = await uniRes.json();
      setCategorias(catJson.data);
      setUnidades(uniJson.data);
    } catch {
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const catColumns: Column<Categoria>[] = [
    { key: "nombre", header: "Nombre", render: (c) => c.nombre },
    {
      key: "descripcion",
      header: "Descripción",
      render: (c) => c.descripcion ?? "—",
    },
  ];

  const uniColumns: Column<Unidad>[] = [
    { key: "nombre", header: "Nombre", render: (u) => u.nombre },
    { key: "abreviatura", header: "Abreviatura", render: (u) => u.abreviatura },
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
          <TablaGenerica
            columns={catColumns}
            data={categorias}
            total={categorias.length}
            page={1}
            pageSize={100}
            loading={loading}
            onPageChange={() => {}}
          />
        )}
        {tab === "unidades" && (
          <TablaGenerica
            columns={uniColumns}
            data={unidades}
            total={unidades.length}
            page={1}
            pageSize={100}
            loading={loading}
            onPageChange={() => {}}
          />
        )}
        {tab === "perfil" && (
          <div className="max-w-md space-y-4">
            <div className="space-y-2">
              <label htmlFor="nombre" className="text-sm font-medium">
                Nombre
              </label>
              <Input id="nombre" defaultValue="Administrador" />
            </div>
            <div className="space-y-2">
              <label htmlFor="correo" className="text-sm font-medium">
                Correo
              </label>
              <Input id="correo" defaultValue="admin@panaderiaduran.com" />
            </div>
            <Button>Guardar Cambios</Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
