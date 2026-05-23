import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { RecetaService } from "@/lib/services";
import { createRecetaSchema } from "@/lib/validations";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query") ?? undefined;

  try {
    const data = query
      ? await RecetaService.search(query)
      : await RecetaService.getAll();
    return NextResponse.json({ data });
  } catch (_error) {
    return NextResponse.json(
      { error: "Error al obtener recetas" },
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
    const parsed = createRecetaSchema.parse(body);
    const result = await RecetaService.create(parsed);
    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && "issues" in error) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Error al crear receta" },
      { status: 500 },
    );
  }
}
