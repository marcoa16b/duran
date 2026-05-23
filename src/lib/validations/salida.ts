import { z } from "zod";

const detalleSalidaSchema = z.object({
  lote_id: z.number().int().positive("Lote requerido"),
  cantidad: z.number().positive("Cantidad debe ser positiva"),
  motivo: z.string().optional(),
});

export const createSalidaSchema = z.object({
  tipo_id: z.number().int().positive("Tipo requerido"),
  fecha: z.string().min(1, "Fecha requerida"),
  observaciones: z.string().optional(),
  detalles: z
    .array(detalleSalidaSchema)
    .min(1, "Al menos un detalle requerido"),
});

export type CreateSalidaInput = z.infer<typeof createSalidaSchema>;
export type DetalleSalidaInput = z.infer<typeof detalleSalidaSchema>;
