import { z } from "zod";

export const createProveedorSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido").max(150),
  telefono: z.string().max(20).optional(),
  correo: z.string().email("Correo inválido").max(150).optional(),
  distrito_id: z.number().int().positive().optional(),
  direccion_exacta: z.string().optional(),
  notas: z.string().optional(),
});

export const updateProveedorSchema = createProveedorSchema.partial();

export type CreateProveedorInput = z.infer<typeof createProveedorSchema>;
export type UpdateProveedorInput = z.infer<typeof updateProveedorSchema>;
