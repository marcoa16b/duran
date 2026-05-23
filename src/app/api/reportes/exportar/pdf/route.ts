import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ExportService } from "@/lib/services";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const { titulo, subtitulo, headers, rows } = await request.json();
    const pdfBytes = await ExportService.generatePDF(
      titulo,
      subtitulo,
      headers,
      rows,
    );
    return new Response(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${titulo}.pdf"`,
      },
    });
  } catch (_error) {
    return NextResponse.json(
      { error: "Error al generar PDF" },
      { status: 500 },
    );
  }
}
