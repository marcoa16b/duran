import * as argon2 from "argon2";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { Rol } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        correo: { label: "Correo", type: "email" },
        contrasena: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const correo = credentials.correo as string;
        const contrasena = credentials.contrasena as string;

        if (!correo || !contrasena) return null;

        const usuario = await prisma.usuario.findFirst({
          where: { correo: correo.toLowerCase(), activo: true },
          include: { rol: true },
        });

        if (!usuario) return null;

        const isValid = await argon2.verify(
          usuario.contrasena_hash,
          contrasena,
        );
        if (!isValid) return null;

        return {
          id: String(usuario.id),
          email: usuario.correo,
          name: usuario.nombre,
          rol: usuario.rol.nombre,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.rol = (user as { rol: string }).rol;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.rol = token.rol as Rol["nombre"];
      }
      return session;
    },
  },
});
