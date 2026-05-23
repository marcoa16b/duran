"use client";

import {
  ArrowDownToLine,
  ArrowUpFromLine,
  BarChart3,
  BellRing,
  BookOpen,
  Boxes,
  Factory,
  FileText,
  Grid2X2,
  Settings,
  Truck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import DuranLogo from "@/app/assets/Duran-logo.png";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: Grid2X2 },
  { href: "/productos", label: "Productos", icon: Boxes },
  { href: "/proveedores", label: "Proveedores", icon: Truck },
  { href: "/entradas", label: "Entradas", icon: ArrowDownToLine },
  { href: "/salidas", label: "Salidas", icon: ArrowUpFromLine },
  { href: "/recetas", label: "Recetas", icon: BookOpen },
  { href: "/produccion-diaria", label: "Producción", icon: Factory },
  { href: "/alertas", label: "Alertas", icon: BellRing },
  { href: "/estadisticas", label: "Estadísticas", icon: BarChart3 },
  { href: "/reportes", label: "Reportes", icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar-background text-sidebar-foreground">
      <div className="px-3 pb-4 pt-5">
        <div className="mb-4 flex items-center gap-3">
          {/* <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#c81e1e] text-sm font-bold text-white ring-2 ring-white/20">
            D
          </div> */}
          <Image src={DuranLogo} alt="Panaderia duran" width={32} height={32} />
          <div className="min-w-0">
            <p className="truncate text-xl font-semibold leading-tight text-foreground">
              Durán
            </p>
            <p className="truncate text-xs leading-tight text-sidebar-foreground/80">
              Panadería y Repostería
            </p>
          </div>
        </div>
        <div className="h-px w-full bg-sidebar-border" />
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors",
                isActive
                  ? "bg-foreground/6"
                  : "text-foreground hover:bg-foreground/5 hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4 shrink-0 text-foreground" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-3 pb-3">
        <div className="mb-3 h-px w-full bg-sidebar-border" />
        <Link
          href="/configuracion"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors",
            pathname === "/configuracion"
              ? "bg-white/6 text-white"
              : "text-[#f4f7fc] hover:bg-white/5 hover:text-white",
          )}
        >
          <Settings className="h-4 w-4 shrink-0 text-[#d7deea]" />
          <span className="truncate">Configuración</span>
        </Link>
      </div>
    </aside>
  );
}
