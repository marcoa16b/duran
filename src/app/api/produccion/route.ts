import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ValidationError } from "@/lib/errors";
import { ProduccionService } from "@/lib/services";
import { createProduccionSchema } from "@/lib/validations";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const fechaInicio = searchParams.get("fechaInicio");
  const fechaFin = searchParams.get("fechaFin");

  try {
    const data =
      fechaInicio && fechaFin
        ? await ProduccionService.getByFechaRange(
            new Date(fechaInicio),
            new Date(fechaFin),
          )
        : await ProduccionService.getAll();
    return NextResponse.json({ data });
  } catch (_error) {
    return NextResponse.json(
      { error: "Error al obtener producciones" },
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
    const parsed = createProduccionSchema.parse(body);
    const result = await ProduccionService.registrarProduccion({
      ...parsed,
      fecha: new Date(parsed.fecha),
      usuario_id: Number(session.user.id),
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof Error && "issues" in error) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Error al registrar producción" },
      { status: 500 },
    );
  }
}
