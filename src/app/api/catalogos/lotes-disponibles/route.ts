import { NextResponse } from "next/server";
import { InventarioService } from "@/lib/services";

export async function GET() {
  try {
    const data = await InventarioService.getLotesDisponibles();
    return NextResponse.json({ data });
  } catch (_error) {
    return NextResponse.json(
      { error: "Error al obtener lotes" },
      { status: 500 },
    );
  }
}
