import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DuplicateError, NotFoundError, ValidationError } from "@/lib/errors";
import { unidadSchema } from "@/lib/validations/config";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;

  try {
    const existing = await prisma.unidadMedida.findUnique({
      where: { id: Number(id) },
    });
    if (!existing) throw new NotFoundError("Unidad no encontrada");

    const body = await request.json();
    const parsed = unidadSchema.parse(body);

    const dupe = await prisma.unidadMedida.findFirst({
      where: {
        id: { not: Number(id) },
        OR: [{ nombre: parsed.nombre }, { abreviatura: parsed.abreviatura }],
      },
    });
    if (dupe) {
      const conflict = dupe.nombre === parsed.nombre ? "nombre" : "abreviatura";
      throw new DuplicateError(`Ya existe otra unidad con ese ${conflict}`);
    }

    const data = await prisma.unidadMedida.update({
      where: { id: Number(id) },
      data: parsed,
    });
    return NextResponse.json({ data });
  } catch (error: unknown) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof DuplicateError || error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof Error && "issues" in error) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Error al actualizar unidad" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;

  try {
    const existing = await prisma.unidadMedida.findUnique({
      where: { id: Number(id) },
    });
    if (!existing) throw new NotFoundError("Unidad no encontrada");

    await prisma.unidadMedida.update({
      where: { id: Number(id) },
      data: { activo: false },
    });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Error al desactivar unidad" },
      { status: 500 },
    );
  }
}
