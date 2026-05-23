import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ValidationError } from "@/lib/errors";
import { AuthService } from "@/lib/services";
import { changePasswordSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const body = await request.json();
    const parsed = changePasswordSchema.parse(body);

    await AuthService.changePassword(
      Number(session.user.id),
      parsed.contrasena_actual,
      parsed.contrasena_nueva,
    );
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof Error && "issues" in error) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Error al cambiar contraseña" },
      { status: 500 },
    );
  }
}
