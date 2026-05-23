import { execSync } from "node:child_process";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST() {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    await prisma.$executeRawUnsafe(
      "DROP SCHEMA public CASCADE; CREATE SCHEMA public;",
    );
    execSync("pnpm prisma db push", { stdio: "pipe" });
    execSync("pnpm tsx prisma/seed.ts", { stdio: "pipe" });
    return NextResponse.json({
      success: true,
      message: "Base de datos sembrada exitosamente",
    });
  } catch (_error) {
    return NextResponse.json(
      { error: "Error al ejecutar seed" },
      { status: 500 },
    );
  }
}
