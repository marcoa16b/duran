"use client";

import { BellRing, CheckCheck, Loader2, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { AlertaCard } from "@/components/ui/alerta-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Alerta {
  id: number;
  mensaje: string;
  leida: boolean;
  creado_en: string;
  tipo: { nombre: string };
  producto: { nombre: string; unidad_medida: { abreviatura: string } };
}

interface DeteccionResult {
  bajo_stock: number;
  proximos_vencer: number;
  total_nuevas: number;
}

export default function AlertasPage() {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [detecting, setDetecting] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchAlertas = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/alertas");
      const json = await res.json();
      setAlertas(json.data ?? []);
      setTotal(json.total ?? 0);
    } catch {
      toast.error("Error al cargar alertas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlertas();
  }, [fetchAlertas]);

  async function detectarAlertas() {
    setDetecting(true);
    try {
      const res = await fetch("/api/alertas/detectar", { method: "POST" });
      const result: DeteccionResult = await res.json();
      if (result.total_nuevas > 0) {
        toast.success(
          `${result.total_nuevas} alerta(s) nueva(s): ${result.bajo_stock} de stock, ${result.proximos_vencer} por vencer`,
        );
      } else {
        toast.info("No se detectaron nuevas alertas");
      }
      fetchAlertas();
    } catch {
      toast.error("Error al detectar alertas");
    } finally {
      setDetecting(false);
    }
  }

  async function marcarTodasLeidas() {
    setMarkingAll(true);
    try {
      const res = await fetch("/api/alertas/leer-todas", { method: "PUT" });
      const json = await res.json();
      toast.success(
        `${json.count ?? "Todas"} las alertas marcadas como leídas`,
      );
      fetchAlertas();
    } catch {
      toast.error("Error al marcar alertas");
    } finally {
      setMarkingAll(false);
    }
  }

  async function marcarLeida(id: number) {
    try {
      await fetch(`/api/alertas/${id}/leer`, { method: "PUT" });
      fetchAlertas();
    } catch {
      toast.error("Error al marcar alerta");
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Alertas</h1>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                total > 0 && (
                  <Badge
                    variant="secondary"
                    className="bg-orange-500/10 text-orange-600 dark:text-orange-400"
                  >
                    {total} no leída{total !== 1 ? "s" : ""}
                  </Badge>
                )
              )}
              {!loading && total === 0 && (
                <Badge
                  variant="secondary"
                  className="text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30"
                >
                  0 no leídas
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Alertas de bajo stock y productos próximos a vencer
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={detectarAlertas}
              disabled={loading || detecting}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${detecting ? "animate-spin" : ""}`}
              />
              {detecting ? "Detectando..." : "Detectar alertas"}
            </Button>
            {total > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={marcarTodasLeidas}
                disabled={loading || markingAll}
              >
                <CheckCheck className="h-4 w-4 mr-2" />
                {markingAll ? "Marcando..." : "Marcar todas leídas"}
              </Button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : alertas.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
            <BellRing className="h-10 w-10" />
            <p className="font-medium">Sin alertas pendientes</p>
            <p className="text-sm">
              Las alertas de bajo stock y caducidad aparecerán aquí.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {alertas.map((a) => (
              <AlertaCard
                key={a.id}
                mensaje={a.mensaje}
                leida={a.leida}
                creadoEn={new Date(a.creado_en)}
                tipoNombre={a.tipo.nombre}
                onMarcarLeida={() => marcarLeida(a.id)}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
