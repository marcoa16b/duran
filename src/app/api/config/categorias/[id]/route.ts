import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DuplicateError, NotFoundError, ValidationError } from "@/lib/errors";
import { categoriaSchema } from "@/lib/validations/config";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;

  try {
    const existing = await prisma.categoriaProducto.findUnique({
      where: { id: Number(id) },
    });
    if (!existing) throw new NotFoundError("Categoría no encontrada");

    const body = await request.json();
    const parsed = categoriaSchema.parse(body);

    const dupe = await prisma.categoriaProducto.findFirst({
      where: { nombre: parsed.nombre, id: { not: Number(id) } },
    });
    if (dupe)
      throw new DuplicateError("Ya existe otra categoría con ese nombre");

    const data = await prisma.categoriaProducto.update({
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
      { error: "Error al actualizar categoría" },
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
    const existing = await prisma.categoriaProducto.findUnique({
      where: { id: Number(id) },
    });
    if (!existing) throw new NotFoundError("Categoría no encontrada");

    await prisma.categoriaProducto.update({
      where: { id: Number(id) },
      data: { activo: false },
    });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Error al desactivar categoría" },
      { status: 500 },
    );
  }
}
