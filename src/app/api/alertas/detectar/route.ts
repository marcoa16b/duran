import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { AlertaService } from "@/lib/services";

export async function POST() {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const result = await AlertaService.ejecutarDeteccionCompleta();
    return NextResponse.json(result);
  } catch (_error) {
    return NextResponse.json(
      { error: "Error al detectar alertas" },
      { status: 500 },
    );
  }
}
