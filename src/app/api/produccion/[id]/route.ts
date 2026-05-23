import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { NotFoundError } from "@/lib/errors";
import { ProduccionService } from "@/lib/services";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  try {
    const data = await ProduccionService.getWithDetalles(Number(id));
    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof NotFoundError)
      return NextResponse.json({ error: error.message }, { status: 404 });
    return NextResponse.json(
      { error: "Error al obtener producción" },
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
    await ProduccionService.deactivate(Number(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof NotFoundError)
      return NextResponse.json({ error: error.message }, { status: 404 });
    return NextResponse.json(
      { error: "Error al desactivar producción" },
      { status: 500 },
    );
  }
}
