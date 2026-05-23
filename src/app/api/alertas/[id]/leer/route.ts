import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { NotFoundError } from "@/lib/errors";
import { AlertaService } from "@/lib/services";

export async function PUT(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  try {
    await AlertaService.marcarLeida(Number(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof NotFoundError)
      return NextResponse.json({ error: error.message }, { status: 404 });
    return NextResponse.json(
      { error: "Error al marcar alerta" },
      { status: 500 },
    );
  }
}
