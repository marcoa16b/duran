import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ReporteService } from "@/lib/services";

export async function GET() {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const data = await ReporteService.getResumenDashboard();
    return NextResponse.json({ data });
  } catch (_error) {
    return NextResponse.json(
      { error: "Error al obtener resumen" },
      { status: 500 },
    );
  }
}
