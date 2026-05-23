import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const data = await prisma.tipo.findMany({
      where: { list_tipo: { nombre: "salida" }, activo: true },
      orderBy: { nombre: "asc" },
    });
    return NextResponse.json({ data });
  } catch (_error) {
    return NextResponse.json(
      { error: "Error al obtener tipos" },
      { status: 500 },
    );
  }
}
