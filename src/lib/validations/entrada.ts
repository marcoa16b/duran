import { z } from "zod";

const loteSchema = z.object({
  producto_id: z.number().int().positive("Producto requerido"),
  cantidad: z.number().positive("Cantidad debe ser positiva"),
  precio_unitario: z.number().min(0).optional(),
  fecha_vencimiento: z.string().optional(),
  codigo_lote: z.string().max(50).optional(),
});

export const createEntradaSchema = z.object({
  tipo_id: z.number().int().positive("Tipo requerido"),
  proveedor_id: z.number().int().positive().optional(),
  fecha: z.string().min(1, "Fecha requerida"),
  numero_factura: z.string().max(50).optional(),
  observaciones: z.string().optional(),
  lotes: z.array(loteSchema).min(1, "Al menos un lote requerido"),
});

export type CreateEntradaInput = z.infer<typeof createEntradaSchema>;
export type LoteInput = z.infer<typeof loteSchema>;
