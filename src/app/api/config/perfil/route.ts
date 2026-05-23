import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { updateProfileSchema } from "@/lib/validations/config";

export async function GET() {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: Number(session.user.id) },
      select: {
        id: true,
        nombre: true,
        correo: true,
        rol: { select: { nombre: true } },
      },
    });
    if (!usuario) throw new NotFoundError("Usuario no encontrado");
    return NextResponse.json({ data: usuario });
  } catch (error: unknown) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Error al obtener perfil" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const body = await request.json();
    const parsed = updateProfileSchema.parse(body);

    const usuario = await prisma.usuario.findUnique({
      where: { id: Number(session.user.id) },
    });
    if (!usuario) throw new NotFoundError("Usuario no encontrado");

    const dupe = await prisma.usuario.findFirst({
      where: {
        correo: parsed.correo.toLowerCase().trim(),
        id: { not: Number(session.user.id) },
      },
    });
    if (dupe)
      throw new ValidationError("El correo ya está en uso por otro usuario");

    const data = await prisma.usuario.update({
      where: { id: Number(session.user.id) },
      data: {
        nombre: parsed.nombre,
        correo: parsed.correo.toLowerCase().trim(),
      },
    });
    return NextResponse.json({ data });
  } catch (error: unknown) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof Error && "issues" in error) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Error al actualizar perfil" },
      { status: 500 },
    );
  }
}
