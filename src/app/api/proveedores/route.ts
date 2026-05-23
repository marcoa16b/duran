import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ValidationError } from "@/lib/errors";
import { createProveedorSchema } from "@/lib/validations";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");
  const offset = Number(searchParams.get("offset") ?? 0);
  const limit = Number(searchParams.get("limit") ?? 20);

  try {
    const where = query
      ? {
          activo: true,
          nombre: { contains: query, mode: "insensitive" as const },
        }
      : { activo: true };

    const [data, total] = await Promise.all([
      prisma.proveedor.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { nombre: "asc" },
      }),
      prisma.proveedor.count({ where }),
    ]);
    return NextResponse.json({ data, total });
  } catch (_error) {
    return NextResponse.json(
      { error: "Error al obtener proveedores" },
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
    const parsed = createProveedorSchema.parse(body);
    const data = await prisma.proveedor.create({ data: parsed });
    return NextResponse.json({ data }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof ValidationError)
      return NextResponse.json({ error: error.message }, { status: 400 });
    if (error instanceof Error && "issues" in error)
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    return NextResponse.json(
      { error: "Error al crear proveedor" },
      { status: 500 },
    );
  }
}
