import { prisma } from "@/lib/db";
import { NotFoundError, ValidationError } from "@/lib/errors";

export const RecetaService = {
  async getById(receta_id: number) {
    const receta = await prisma.receta.findUnique({
      where: { id: receta_id, activo: true },
      include: { producto: true },
    });
    if (!receta) throw new NotFoundError("Receta no encontrada");
    return receta;
  },

  async getWithDetalles(receta_id: number) {
    const receta = await prisma.receta.findUnique({
      where: { id: receta_id, activo: true },
      include: {
        producto: true,
        ingredientes: {
          where: { activo: true },
          include: { producto: { include: { unidad_medida: true } } },
        },
      },
    });
    if (!receta) throw new NotFoundError("Receta no encontrada");
    return receta;
  },

  async getAll(onlyActive = true) {
    return prisma.receta.findMany({
      where: onlyActive ? { activo: true } : {},
      include: {
        producto: true,
        _count: { select: { ingredientes: true } },
      },
      orderBy: { nombre: "asc" },
    });
  },

  async search(query: string) {
    if (query.length < 2) return [];
    return prisma.receta.findMany({
      where: {
        activo: true,
        OR: [
          { nombre: { contains: query, mode: "insensitive" } },
          { descripcion: { contains: query, mode: "insensitive" } },
        ],
      },
      include: { producto: true },
      take: 20,
      orderBy: { nombre: "asc" },
    });
  },

  async getByProducto(producto_id: number) {
    return prisma.receta.findMany({
      where: { producto_id, activo: true },
      include: { _count: { select: { ingredientes: true } } },
    });
  },

  async create(data: {
    nombre: string;
    producto_id: number;
    descripcion?: string;
    ingredientes: Array<{ producto_id: number; cantidad: number }>;
  }) {
    if (!data.ingredientes.length)
      throw new ValidationError("Al menos un ingrediente requerido");
    validateIngredientes(data.ingredientes);

    return prisma.$transaction(async (tx) => {
      const receta = await tx.receta.create({
        data: {
          nombre: data.nombre,
          producto_id: data.producto_id,
          descripcion: data.descripcion,
        },
      });

      const detalles = await Promise.all(
        data.ingredientes.map((ing) =>
          tx.recetaDetalle.create({
            data: {
              receta_id: receta.id,
              producto_id: ing.producto_id,
              cantidad: ing.cantidad,
            },
          }),
        ),
      );

      return { receta, detalles };
    });
  },

  async update(
    receta_id: number,
    data: { nombre?: string; descripcion?: string },
  ) {
    const receta = await prisma.receta.findUnique({
      where: { id: receta_id, activo: true },
    });
    if (!receta) throw new NotFoundError("Receta no encontrada");

    return prisma.receta.update({ where: { id: receta_id }, data });
  },

  async updateIngredientes(
    receta_id: number,
    ingredientes: Array<{ producto_id: number; cantidad: number }>,
  ) {
    const receta = await prisma.receta.findUnique({
      where: { id: receta_id, activo: true },
    });
    if (!receta) throw new NotFoundError("Receta no encontrada");
    if (!ingredientes.length)
      throw new ValidationError("Al menos un ingrediente requerido");
    validateIngredientes(ingredientes);

    return prisma.$transaction(async (tx) => {
      await tx.recetaDetalle.updateMany({
        where: { receta_id },
        data: { activo: false },
      });

      const detalles = await Promise.all(
        ingredientes.map((ing) =>
          tx.recetaDetalle.create({
            data: {
              receta_id,
              producto_id: ing.producto_id,
              cantidad: ing.cantidad,
            },
          }),
        ),
      );

      return { receta, detalles };
    });
  },

  async deactivate(receta_id: number) {
    const receta = await prisma.receta.findUnique({
      where: { id: receta_id, activo: true },
    });
    if (!receta) throw new NotFoundError("Receta no encontrada");
    await prisma.receta.update({
      where: { id: receta_id },
      data: { activo: false },
    });
    return true;
  },

  async getIngredientes(receta_id: number) {
    return prisma.recetaDetalle.findMany({
      where: { receta_id, activo: true },
      include: { producto: { include: { unidad_medida: true } } },
    });
  },

  async calcularInsumosNecesarios(receta_id: number, cantidadProducir: number) {
    const receta = await this.getWithDetalles(receta_id);
    return receta.ingredientes.map((ing) => ({
      producto_id: ing.producto_id,
      producto_nombre: ing.producto.nombre,
      unidad: ing.producto.unidad_medida.abreviatura,
      cantidad_por_unidad: Number(ing.cantidad),
      cantidad_necesaria: Number(ing.cantidad) * cantidadProducir,
    }));
  },

  async verificarInsumosDisponibles(
    receta_id: number,
    cantidadProducir: number,
  ) {
    const insumos = await this.calcularInsumosNecesarios(
      receta_id,
      cantidadProducir,
    );
    const productos = await prisma.producto.findMany({
      where: {
        id: { in: insumos.map((i) => i.producto_id) },
        activo: true,
      },
    });

    const stockMap = new Map(
      productos.map((p) => [p.id, Number(p.stock_actual)]),
    );

    let disponible = true;
    const detalle = insumos.map((ins) => {
      const stock = stockMap.get(ins.producto_id) ?? 0;
      const suficiente = stock >= ins.cantidad_necesaria;
      if (!suficiente) disponible = false;
      return { ...ins, stock_disponible: stock, suficiente };
    });

    return { disponible, detalle };
  },
};

function validateIngredientes(
  ingredientes: Array<{ producto_id: number; cantidad: number }>,
) {
  for (const ing of ingredientes) {
    if (!ing.producto_id)
      throw new ValidationError("Producto requerido en ingrediente");
    if (ing.cantidad <= 0)
      throw new ValidationError("Cantidad debe ser positiva");
  }
}
