import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { AlertaService } from "@/lib/services";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const onlyUnread = searchParams.get("onlyUnread") === "true";

  try {
    const data = await AlertaService.getAlertasActivas(onlyUnread);
    const total = await AlertaService.countActivas();
    return NextResponse.json({ data, total });
  } catch (_error) {
    return NextResponse.json(
      { error: "Error al obtener alertas" },
      { status: 500 },
    );
  }
}
