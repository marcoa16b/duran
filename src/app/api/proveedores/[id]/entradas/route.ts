import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  try {
    const data = await prisma.entradaInventario.findMany({
      where: { proveedor_id: Number(id), activo: true },
      include: {
        tipo: true,
        _count: { select: { lotes: true } },
      },
      orderBy: { fecha: "desc" },
    });
    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }
    return NextResponse.json(
      { error: "Error al obtener entradas del proveedor" },
      { status: 500 },
    );
  }
}
