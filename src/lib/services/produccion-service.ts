import { prisma } from "@/lib/db";
import { AppError, NotFoundError, ValidationError } from "@/lib/errors";
import { RecetaService } from "./receta-service";

export const ProduccionService = {
  async getById(produccion_id: number) {
    const p = await prisma.produccionDiaria.findUnique({
      where: { id: produccion_id, activo: true },
      include: { receta: { include: { producto: true } }, usuario: true },
    });
    if (!p) throw new NotFoundError("Producción no encontrada");
    return p;
  },

  async getWithDetalles(produccion_id: number) {
    const p = await prisma.produccionDiaria.findUnique({
      where: { id: produccion_id, activo: true },
      include: {
        receta: { include: { producto: true } },
        usuario: true,
        detalles: {
          where: { activo: true },
          include: {
            lote: {
              include: { producto: { include: { unidad_medida: true } } },
            },
          },
        },
      },
    });
    if (!p) throw new NotFoundError("Producción no encontrada");
    return p;
  },

  async getAll(onlyActive = true) {
    return prisma.produccionDiaria.findMany({
      where: onlyActive ? { activo: true } : {},
      include: {
        receta: { include: { producto: true } },
        _count: { select: { detalles: true } },
      },
      orderBy: { fecha: "desc" },
    });
  },

  async getByFechaRange(fechaInicio: Date, fechaFin: Date) {
    return prisma.produccionDiaria.findMany({
      where: { fecha: { gte: fechaInicio, lte: fechaFin }, activo: true },
      include: {
        receta: { include: { producto: true } },
        _count: { select: { detalles: true } },
      },
      orderBy: { fecha: "desc" },
    });
  },

  async getByReceta(receta_id: number) {
    return prisma.produccionDiaria.findMany({
      where: { receta_id, activo: true },
      orderBy: { fecha: "desc" },
    });
  },

  async registrarProduccion(data: {
    receta_id: number;
    fecha: Date;
    cantidad_producida: number;
    usuario_id?: number;
    observaciones?: string;
  }) {
    if (data.cantidad_producida <= 0) {
      throw new ValidationError("Cantidad producida debe ser positiva");
    }

    const insumos = await RecetaService.calcularInsumosNecesarios(
      data.receta_id,
      data.cantidad_producida,
    );

    const asignaciones = await this._asignarLotesFIFO(insumos);

    return prisma.$transaction(async (tx) => {
      const produccion = await tx.produccionDiaria.create({
        data: {
          receta_id: data.receta_id,
          fecha: data.fecha,
          cantidad_producida: data.cantidad_producida,
          usuario_id: data.usuario_id,
          observaciones: data.observaciones,
        },
      });

      const detalles = await Promise.all(
        asignaciones.map((a) =>
          tx.produccionDetalle.create({
            data: {
              produccion_id: produccion.id,
              lote_id: a.lote_id,
              cantidad: a.cantidad,
            },
          }),
        ),
      );

      for (const det of detalles) {
        const lote = await tx.loteInventario.findUniqueOrThrow({
          where: { id: det.lote_id },
        });
        await tx.producto.update({
          where: { id: lote.producto_id },
          data: { stock_actual: { decrement: det.cantidad } },
        });
      }

      const receta = await tx.receta.findUniqueOrThrow({
        where: { id: data.receta_id },
      });
      await tx.producto.update({
        where: { id: receta.producto_id },
        data: { stock_actual: { increment: data.cantidad_producida } },
      });

      return { produccion, detalles };
    });
  },

  async deactivate(produccion_id: number) {
    const p = await prisma.produccionDiaria.findUnique({
      where: { id: produccion_id, activo: true },
    });
    if (!p) throw new NotFoundError("Producción no encontrada");
    await prisma.produccionDiaria.update({
      where: { id: produccion_id },
      data: { activo: false },
    });
    return true;
  },

  async _asignarLotesFIFO(
    insumos: Array<{ producto_id: number; cantidad_necesaria: number }>,
  ) {
    const consumos: Array<{
      lote_id: number;
      producto_id: number;
      cantidad: number;
    }> = [];

    for (const insumo of insumos) {
      let pendiente = insumo.cantidad_necesaria;

      const lotes = await prisma.loteInventario.findMany({
        where: { producto_id: insumo.producto_id, activo: true },
        orderBy: [{ fecha_vencimiento: { sort: "asc", nulls: "last" } }],
      });

      for (const lote of lotes) {
        if (pendiente <= 0) break;

        const stock = await this._calcularStockLoteDisponible(lote.id);
        if (stock <= 0) continue;

        const consumir = Math.min(pendiente, stock);
        consumos.push({
          lote_id: lote.id,
          producto_id: insumo.producto_id,
          cantidad: consumir,
        });
        pendiente -= consumir;
      }

      if (pendiente > 0) {
        throw new AppError(
          `Insumos insuficientes para producto_id=${insumo.producto_id}. Faltan ${pendiente} unidades.`,
        );
      }
    }

    return consumos;
  },

  async _calcularStockLoteDisponible(lote_id: number): Promise<number> {
    const lote = await prisma.loteInventario.findUnique({
      where: { id: lote_id },
    });
    if (!lote) return 0;

    const [sumSalidas, sumProduccion] = await Promise.all([
      prisma.detalleSalidaInventario.aggregate({
        where: { lote_id, activo: true },
        _sum: { cantidad: true },
      }),
      prisma.produccionDetalle.aggregate({
        where: { lote_id, activo: true },
        _sum: { cantidad: true },
      }),
    ]);

    const salidas = Number(sumSalidas._sum.cantidad ?? 0);
    const produccion = Number(sumProduccion._sum.cantidad ?? 0);
    return Number(lote.cantidad) - salidas - produccion;
  },
};
