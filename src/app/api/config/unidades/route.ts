import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DuplicateError, ValidationError } from "@/lib/errors";
import { unidadSchema } from "@/lib/validations/config";

export async function GET() {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const data = await prisma.unidadMedida.findMany({
      orderBy: { nombre: "asc" },
    });
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json(
      { error: "Error al obtener unidades" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const body = await request.json();
    const parsed = unidadSchema.parse(body);

    const dupe = await prisma.unidadMedida.findFirst({
      where: {
        OR: [{ nombre: parsed.nombre }, { abreviatura: parsed.abreviatura }],
      },
    });
    if (dupe) {
      const conflict = dupe.nombre === parsed.nombre ? "nombre" : "abreviatura";
      throw new DuplicateError(`Ya existe una unidad con ese ${conflict}`);
    }

    const data = await prisma.unidadMedida.create({ data: parsed });
    return NextResponse.json({ data }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof DuplicateError || error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof Error && "issues" in error) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Error al crear unidad" },
      { status: 500 },
    );
  }
}
