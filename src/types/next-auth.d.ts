import type { Rol } from "@/app/generated/prisma/client";
import "next-auth";

declare module "next-auth" {
  interface User {
    rol: Rol["nombre"];
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      rol: Rol["nombre"];
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    rol: Rol["nombre"];
  }
}
