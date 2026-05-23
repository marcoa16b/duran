import { z } from "zod";

const ingredienteSchema = z.object({
  producto_id: z.number().int().positive("Producto requerido"),
  cantidad: z.number().positive("Cantidad debe ser positiva"),
});

export const createRecetaSchema = z.object({
  producto_id: z.number().int().positive("Producto final requerido"),
  nombre: z.string().min(1, "Nombre requerido").max(150),
  descripcion: z.string().optional(),
  ingredientes: z
    .array(ingredienteSchema)
    .min(1, "Al menos un ingrediente requerido"),
});

export const updateRecetaSchema = z.object({
  nombre: z.string().min(1).max(150).optional(),
  descripcion: z.string().optional(),
  ingredientes: z.array(ingredienteSchema).min(1).optional(),
});

export type CreateRecetaInput = z.infer<typeof createRecetaSchema>;
export type UpdateRecetaInput = z.infer<typeof updateRecetaSchema>;
export type IngredienteInput = z.infer<typeof ingredienteSchema>;
