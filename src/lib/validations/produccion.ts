import { z } from "zod";

export const createProduccionSchema = z.object({
  receta_id: z.number().int().positive("Receta requerida"),
  fecha: z.string().min(1, "Fecha requerida"),
  cantidad_producida: z
    .number()
    .positive("Cantidad producida debe ser positiva"),
  observaciones: z.string().optional(),
});

export type CreateProduccionInput = z.infer<typeof createProduccionSchema>;
