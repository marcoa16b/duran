import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { RecetaService } from "@/lib/services";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const url = new URL(request.url);
  const cantidad = Number(url.searchParams.get("cantidad"));

  if (!cantidad || cantidad <= 0) {
    return NextResponse.json({ error: "Cantidad inválida" }, { status: 400 });
  }

  try {
    const data = await RecetaService.verificarInsumosDisponibles(
      Number(id),
      cantidad,
    );
    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof NotFoundError)
      return NextResponse.json({ error: error.message }, { status: 404 });
    if (error instanceof ValidationError)
      return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(
      { error: "Error al verificar disponibilidad" },
      { status: 500 },
    );
  }
}
