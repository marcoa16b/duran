"use client";

import { useTheme } from "@wrksz/themes/client";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  Bell,
  BellRing,
  Check,
  Loader2,
  LogOut,
  Moon,
  Sun,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AlertaPopup {
  id: number;
  mensaje: string;
  leida: boolean;
  creado_en: string;
  tipo: { nombre: string };
  producto: { nombre: string };
}

export function Header() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [alertas, setAlertas] = useState<AlertaPopup[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const detectedRef = useRef(false);

  const fetchAlertas = useCallback(async () => {
    try {
      const res = await fetch("/api/alertas");
      const json = await res.json();
      setAlertas(json.data ?? []);
      setUnreadCount(json.total ?? 0);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (detectedRef.current) return;
    detectedRef.current = true;

    const init = async () => {
      try {
        await fetch("/api/alertas/detectar", { method: "POST" });
      } catch {
        // silent
      }
      fetchAlertas();
    };
    init();
  }, [fetchAlertas]);

  async function marcarLeida(id: number) {
    setAlertas((prev) =>
      prev.map((a) => (a.id === id ? { ...a, leida: true } : a)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await fetch(`/api/alertas/${id}/leer`, { method: "PUT" });
    } catch {
      setAlertas((prev) =>
        prev.map((a) => (a.id === id ? { ...a, leida: false } : a)),
      );
      setUnreadCount((prev) => prev + 1);
    }
  }

  const initials = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-6">
      <div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger className="relative inline-flex shrink-0 items-center justify-center rounded-md border border-transparent bg-transparent h-9 w-9 hover:bg-muted hover:text-foreground transition-all outline-none cursor-pointer">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 min-w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground px-0.5">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8} className="w-80">
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <div className="flex items-center justify-between">
                  <span>Alertas</span>
                  {unreadCount > 0 && (
                    <Badge
                      variant="secondary"
                      className="text-orange-600 bg-orange-500/10 dark:text-orange-400 text-xs"
                    >
                      {unreadCount} no leída{unreadCount !== 1 ? "s" : ""}
                    </Badge>
                  )}
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            {loading ? (
              <div className="flex items-center justify-center py-6 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : alertas.length === 0 ? (
              <div className="flex flex-col items-center gap-1 py-6 text-muted-foreground">
                <BellRing className="h-5 w-5" />
                <p className="text-sm">Sin alertas pendientes</p>
              </div>
            ) : (
              alertas.slice(0, 5).map((a) => (
                <DropdownMenuItem
                  key={a.id}
                  className="flex items-start gap-2 py-2 px-2"
                  onClick={() => marcarLeida(a.id)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs leading-tight line-clamp-2">
                      {a.mensaje}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {formatDistanceToNow(new Date(a.creado_en), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </p>
                  </div>
                  {!a.leida && (
                    <span className="shrink-0 mt-0.5">
                      <Check className="h-3 w-3 text-muted-foreground" />
                    </span>
                  )}
                </DropdownMenuItem>
              ))
            )}
            {alertas.length > 5 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="justify-center"
                  onClick={() => router.push("/alertas")}
                >
                  <span className="text-xs text-muted-foreground w-full text-center">
                    Ver todas ({alertas.length})
                  </span>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
        </div>

        <AlertDialog>
          <AlertDialogTrigger>
            <Button variant="ghost" size="icon" asChild>
              <LogOut className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cerrar sesión</AlertDialogTitle>
              <AlertDialogDescription>
                ¿Estás seguro de que deseas cerrar sesión?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => signOut()}>
                Cerrar sesión
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </header>
  );
}
