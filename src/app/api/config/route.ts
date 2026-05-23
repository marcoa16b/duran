import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const [categorias, unidades] = await Promise.all([
      prisma.categoriaProducto.findMany({
        where: { activo: true },
        orderBy: { nombre: "asc" },
      }),
      prisma.unidadMedida.findMany({
        where: { activo: true },
        orderBy: { nombre: "asc" },
      }),
    ]);
    return NextResponse.json({ categorias, unidades });
  } catch (_error) {
    return NextResponse.json(
      { error: "Error al obtener configuración" },
      { status: 500 },
    );
  }
}
