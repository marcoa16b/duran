import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const data = await prisma.distrito.findMany({
      where: { activo: true },
      include: {
        canton: {
          include: { provincia: true },
        },
      },
      orderBy: { nombre: "asc" },
    });
    const mapped = data.map((d) => ({
      id: d.id,
      nombre: `${d.nombre}, ${d.canton.nombre}, ${d.canton.provincia.nombre}`,
      canton_id: d.canton_id,
    }));
    return NextResponse.json({ data: mapped });
  } catch (_error) {
    return NextResponse.json(
      { error: "Error al obtener distritos" },
      { status: 500 },
    );
  }
}
