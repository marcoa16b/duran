import { z } from "zod";

export const categoriaSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido").max(100),
  descripcion: z.string().optional(),
});

export const unidadSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido").max(50),
  abreviatura: z.string().min(1, "Abreviatura requerida").max(10),
});

export const updateProfileSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido").max(100),
  correo: z.string().email("Correo inválido"),
});

export type CategoriaInput = z.infer<typeof categoriaSchema>;
export type UnidadInput = z.infer<typeof unidadSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
