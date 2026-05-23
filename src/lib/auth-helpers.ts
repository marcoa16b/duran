import { auth as authjs } from "@/lib/auth";

export async function requireAuth() {
  const session = await authjs();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session;
}
