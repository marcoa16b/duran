import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { AlertTriangle, Bell, CalendarClock, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface AlertaCardProps {
  mensaje: string;
  leida: boolean;
  creadoEn: Date;
  tipoNombre?: string;
  onMarcarLeida: () => void;
}

export function AlertaCard({
  mensaje,
  leida,
  creadoEn,
  tipoNombre,
  onMarcarLeida,
}: AlertaCardProps) {
  const esBajoStock = tipoNombre === "Bajo stock";
  const esProximoVencer = tipoNombre === "Próximo a vencer";

  const IconComponent = esBajoStock
    ? AlertTriangle
    : esProximoVencer
      ? CalendarClock
      : Bell;

  const iconBg = leida
    ? "bg-muted"
    : esBajoStock
      ? "bg-orange-500/10"
      : esProximoVencer
        ? "bg-red-500/10"
        : "bg-orange-500/10";

  const iconColor = leida
    ? "text-muted-foreground"
    : esBajoStock
      ? "text-orange-500"
      : esProximoVencer
        ? "text-red-500"
        : "text-orange-500";

  return (
    <Card
      className={
        leida ? "opacity-60" : "border-orange-500/20 bg-orange-500/[0.02]"
      }
    >
      <CardContent className="p-4 flex items-start gap-3">
        <div className={`p-2 rounded-full ${iconBg}`}>
          <IconComponent className={`h-4 w-4 ${iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm ${leida ? "text-muted-foreground" : "text-foreground"}`}
          >
            {mensaje}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {formatDistanceToNow(new Date(creadoEn), {
              addSuffix: true,
              locale: es,
            })}
          </p>
        </div>
        {leida ? (
          <Badge variant="outline" className="shrink-0 mt-0.5">
            Leída
          </Badge>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={onMarcarLeida}
          >
            <Check className="h-4 w-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
