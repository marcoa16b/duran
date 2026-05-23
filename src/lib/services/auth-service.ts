import * as argon2 from "argon2";
import { prisma } from "@/lib/db";
import { NotFoundError, ValidationError } from "@/lib/errors";

export const AuthService = {
  async register(
    nombre: string,
    correo: string,
    password: string,
    rol_id: number,
  ) {
    const email = correo.toLowerCase().trim();
    const existing = await prisma.usuario.findUnique({
      where: { correo: email },
    });
    if (existing) throw new ValidationError("El correo ya está registrado");
    if (password.length < 8)
      throw new ValidationError(
        "La contraseña debe tener al menos 8 caracteres",
      );

    const contrasena_hash = await argon2.hash(password);
    return prisma.usuario.create({
      data: { nombre, correo: email, contrasena_hash, rol_id },
    });
  },

  async changePassword(
    usuario_id: number,
    currentPassword: string,
    newPassword: string,
  ) {
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuario_id },
    });
    if (!usuario) throw new NotFoundError("Usuario no encontrado");

    const valid = await argon2.verify(usuario.contrasena_hash, currentPassword);
    if (!valid) throw new ValidationError("Contraseña actual incorrecta");
    if (newPassword.length < 8)
      throw new ValidationError("Mínimo 8 caracteres");

    const contrasena_hash = await argon2.hash(newPassword);
    await prisma.usuario.update({
      where: { id: usuario_id },
      data: { contrasena_hash },
    });
    return true;
  },

  async resetPassword(correo: string, newPassword: string) {
    const email = correo.toLowerCase().trim();
    const usuario = await prisma.usuario.findUnique({
      where: { correo: email },
    });
    if (!usuario) throw new NotFoundError("Usuario no encontrado");
    if (newPassword.length < 8)
      throw new ValidationError("Mínimo 8 caracteres");

    const contrasena_hash = await argon2.hash(newPassword);
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { contrasena_hash },
    });
    return true;
  },

  async getPerfil(usuario_id: number) {
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuario_id },
      include: { rol: true },
    });
    if (!usuario) throw new NotFoundError("Usuario no encontrado");
    return usuario;
  },
};
