import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ExportService } from "@/lib/services";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const { titulo, headers, rows } = await request.json();
    const excelBytes = await ExportService.generateExcel(titulo, headers, rows);
    return new Response(Buffer.from(excelBytes), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${titulo}.xlsx"`,
      },
    });
  } catch (_error) {
    return NextResponse.json(
      { error: "Error al generar Excel" },
      { status: 500 },
    );
  }
}
