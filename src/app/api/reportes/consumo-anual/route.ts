import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ReporteService } from "@/lib/services";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const year = searchParams.get("year")
    ? Number(searchParams.get("year"))
    : undefined;

  try {
    const data = await ReporteService.getConsumoAnual(year);
    return NextResponse.json({ data });
  } catch (_error) {
    return NextResponse.json(
      { error: "Error al obtener consumo anual" },
      { status: 500 },
    );
  }
}
