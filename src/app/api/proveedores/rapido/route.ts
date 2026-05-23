import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createProveedorSchema } from "@/lib/validations";

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
    if (error instanceof Error && "issues" in error)
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    return NextResponse.json(
      { error: "Error al crear proveedor" },
      { status: 500 },
    );
  }
}
