import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { AlertaService } from "@/lib/services";

export async function PUT() {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const count = await AlertaService.marcarTodasLeidas();
    return NextResponse.json({ success: true, count });
  } catch (_error) {
    return NextResponse.json(
      { error: "Error al marcar alertas" },
      { status: 500 },
    );
  }
}
