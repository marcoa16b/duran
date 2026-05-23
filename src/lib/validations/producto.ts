import { z } from "zod";

export const createProductoSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido").max(150),
  descripcion: z.string().optional(),
  categoria_id: z.number().int().positive("Categoría requerida"),
  unidad_medida_id: z.number().int().positive("Unidad de medida requerida"),
  stock_minimo: z.number().min(0, "Stock mínimo no puede ser negativo"),
  ubicacion: z.string().max(100).optional(),
  imagen_url: z.string().max(500).optional(),
});

export const updateProductoSchema = createProductoSchema.partial();

export type CreateProductoInput = z.infer<typeof createProductoSchema>;
export type UpdateProductoInput = z.infer<typeof updateProductoSchema>;
