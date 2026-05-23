import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ReporteService } from "@/lib/services";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const fechaInicio =
    searchParams.get("fechaInicio") ??
    new Date(new Date().getFullYear(), 0, 1).toISOString();
  const fechaFin = searchParams.get("fechaFin") ?? new Date().toISOString();

  try {
    const data = await ReporteService.getEntradasPeriodo(
      new Date(fechaInicio),
      new Date(fechaFin),
    );
    return NextResponse.json({ data });
  } catch (_error) {
    return NextResponse.json(
      { error: "Error al obtener entradas" },
      { status: 500 },
    );
  }
}
