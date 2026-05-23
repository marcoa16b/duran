import { z } from "zod";

export const loginSchema = z.object({
  correo: z.string().email("Correo inválido"),
  contrasena: z.string().min(1, "Contraseña requerida"),
});

export const changePasswordSchema = z
  .object({
    contrasena_actual: z.string().min(1, "Contraseña actual requerida"),
    contrasena_nueva: z
      .string()
      .min(6, "Mínimo 6 caracteres")
      .max(100, "Máximo 100 caracteres"),
    confirmar_contrasena: z.string().min(1, "Confirmar contraseña requerida"),
  })
  .refine((data) => data.contrasena_nueva === data.confirmar_contrasena, {
    message: "Las contraseñas no coinciden",
    path: ["confirmar_contrasena"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
