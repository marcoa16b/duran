import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoriaId = searchParams.get("categoria_id");

    const where: Record<string, unknown> = { activo: true };
    if (categoriaId) {
      where.categoria_id = Number(categoriaId);
    }

    const data = await prisma.producto.findMany({
      where,
      include: { unidad_medida: true, categoria_producto: true },
      orderBy: { nombre: "asc" },
    });
    return NextResponse.json({ data });
  } catch (_error) {
    return NextResponse.json(
      { error: "Error al obtener productos" },
      { status: 500 },
    );
  }
}
