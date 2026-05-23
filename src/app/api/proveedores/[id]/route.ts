import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NotFoundError } from "@/lib/errors";
import { updateProveedorSchema } from "@/lib/validations";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  try {
    const data = await prisma.proveedor.findUnique({
      where: { id: Number(id), activo: true },
      include: { distrito: true },
    });
    if (!data)
      return NextResponse.json(
        { error: "Proveedor no encontrado" },
        { status: 404 },
      );
    return NextResponse.json({ data });
  } catch (_error) {
    return NextResponse.json(
      { error: "Error al obtener proveedor" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  try {
    const body = await request.json();
    const parsed = updateProveedorSchema.parse(body);
    const data = await prisma.proveedor.update({
      where: { id: Number(id) },
      data: parsed,
    });
    return NextResponse.json({ data });
  } catch (error: unknown) {
    if (error instanceof NotFoundError)
      return NextResponse.json({ error: error.message }, { status: 404 });
    if (error instanceof Error && "issues" in error)
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    return NextResponse.json(
      { error: "Error al actualizar proveedor" },
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
    await prisma.proveedor.update({
      where: { id: Number(id) },
      data: { activo: false },
    });
    return NextResponse.json({ success: true });
  } catch (_error) {
    return NextResponse.json(
      { error: "Error al desactivar proveedor" },
      { status: 500 },
    );
  }
}
