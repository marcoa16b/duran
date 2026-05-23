import { prisma } from "@/lib/db";
import { NotFoundError, ValidationError } from "@/lib/errors";

export const InventarioService = {
  async registrarEntrada(data: {
    tipo_id: number;
    fecha: Date;
    proveedor_id?: number;
    numero_factura?: string;
    observaciones?: string;
    usuario_id?: number;
    lotes: Array<{
      producto_id: number;
      cantidad: number;
      precio_unitario?: number;
      fecha_vencimiento?: Date;
      codigo_lote?: string;
    }>;
  }) {
    if (!data.lotes.length)
      throw new ValidationError("Al menos un lote requerido");

    return prisma.$transaction(async (tx) => {
      const entrada = await tx.entradaInventario.create({
        data: {
          tipo_id: data.tipo_id,
          fecha: data.fecha,
          proveedor_id: data.proveedor_id,
          numero_factura: data.numero_factura,
          observaciones: data.observaciones,
          usuario_id: data.usuario_id,
        },
      });

      const lotes = await Promise.all(
        data.lotes.map((l) =>
          tx.loteInventario.create({
            data: {
              entrada_id: entrada.id,
              producto_id: l.producto_id,
              cantidad: l.cantidad,
              precio_unitario: l.precio_unitario,
              fecha_vencimiento: l.fecha_vencimiento,
              codigo_lote: l.codigo_lote,
            },
          }),
        ),
      );

      for (const lote of lotes) {
        await tx.producto.update({
          where: { id: lote.producto_id },
          data: { stock_actual: { increment: lote.cantidad } },
        });
      }

      return { entrada, lotes };
    });
  },

  async getEntradaWithLotes(entrada_id: number) {
    const entrada = await prisma.entradaInventario.findUnique({
      where: { id: entrada_id, activo: true },
      include: {
        tipo: true,
        proveedor: true,
        usuario: true,
        lotes: {
          where: { activo: true },
          include: { producto: { include: { unidad_medida: true } } },
        },
      },
    });
    if (!entrada) throw new NotFoundError("Entrada no encontrada");
    return entrada;
  },

  async getEntradasByFecha(fechaInicio: Date, fechaFin: Date) {
    return prisma.entradaInventario.findMany({
      where: {
        fecha: { gte: fechaInicio, lte: fechaFin },
        activo: true,
      },
      include: {
        tipo: true,
        proveedor: true,
        _count: { select: { lotes: true } },
      },
      orderBy: { fecha: "desc" },
    });
  },

  async getEntradasByProveedor(proveedor_id: number) {
    return prisma.entradaInventario.findMany({
      where: { proveedor_id, activo: true },
      include: { tipo: true, _count: { select: { lotes: true } } },
      orderBy: { fecha: "desc" },
    });
  },

  async registrarSalida(data: {
    tipo_id: number;
    fecha: Date;
    observaciones?: string;
    usuario_id?: number;
    detalles: Array<{
      lote_id: number;
      cantidad: number;
      motivo?: string;
    }>;
  }) {
    if (!data.detalles.length)
      throw new ValidationError("Al menos un detalle requerido");

    for (const d of data.detalles) {
      const stock = await calcularStockLote(d.lote_id);
      if (stock < d.cantidad) {
        throw new ValidationError(
          `Stock insuficiente en lote ID ${d.lote_id}: disponible ${stock}, requerido ${d.cantidad}`,
        );
      }
    }

    return prisma.$transaction(async (tx) => {
      const salida = await tx.salidaInventario.create({
        data: {
          tipo_id: data.tipo_id,
          fecha: data.fecha,
          observaciones: data.observaciones,
          usuario_id: data.usuario_id,
        },
      });

      const detalles = await Promise.all(
        data.detalles.map((d) =>
          tx.detalleSalidaInventario.create({
            data: {
              salida_id: salida.id,
              lote_id: d.lote_id,
              cantidad: d.cantidad,
              motivo: d.motivo,
            },
            include: { lote: true },
          }),
        ),
      );

      for (const det of detalles) {
        await tx.producto.update({
          where: { id: det.lote.producto_id },
          data: { stock_actual: { decrement: det.cantidad } },
        });
      }

      return { salida, detalles };
    });
  },

  async getSalidaWithDetalles(salida_id: number) {
    const salida = await prisma.salidaInventario.findUnique({
      where: { id: salida_id, activo: true },
      include: {
        tipo: true,
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
    if (!salida) throw new NotFoundError("Salida no encontrada");
    return salida;
  },

  async getSalidasByFecha(fechaInicio: Date, fechaFin: Date) {
    return prisma.salidaInventario.findMany({
      where: { fecha: { gte: fechaInicio, lte: fechaFin }, activo: true },
      include: {
        tipo: true,
        _count: { select: { detalles: true } },
      },
      orderBy: { fecha: "desc" },
    });
  },

  async getLotesByProducto(producto_id: number) {
    return prisma.loteInventario.findMany({
      where: { producto_id, activo: true },
      orderBy: { fecha_vencimiento: { sort: "asc", nulls: "last" } },
    });
  },

  async getLotesProximosAVencer(dias: number) {
    const hoy = new Date();
    const limite = new Date(hoy.getTime() + dias * 86400000);
    return prisma.loteInventario.findMany({
      where: {
        fecha_vencimiento: { gte: hoy, lte: limite },
        activo: true,
      },
      include: { producto: true, entrada: true },
      orderBy: { fecha_vencimiento: "asc" },
    });
  },

  async getLotesDisponibles() {
    const lotes = await prisma.loteInventario.findMany({
      where: { activo: true },
      include: { producto: { include: { unidad_medida: true } } },
      orderBy: { fecha_vencimiento: { sort: "asc", nulls: "last" } },
    });
    const result = [];
    for (const lote of lotes) {
      const stock = await calcularStockLote(lote.id);
      if (stock > 0) {
        result.push({ ...lote, stock_disponible: stock });
      }
    }
    return result;
  },
};

async function calcularStockLote(lote_id: number): Promise<number> {
  const lote = await prisma.loteInventario.findUnique({
    where: { id: lote_id },
  });
  if (!lote) return 0;

  const aggregateSalidas = await prisma.detalleSalidaInventario.aggregate({
    where: { lote_id, activo: true },
    _sum: { cantidad: true },
  });
  const aggregateProduccion = await prisma.produccionDetalle.aggregate({
    where: { lote_id, activo: true },
    _sum: { cantidad: true },
  });

  const salidas = Number(aggregateSalidas._sum.cantidad ?? 0);
  const produccion = Number(aggregateProduccion._sum.cantidad ?? 0);
  return Number(lote.cantidad) - salidas - produccion;
}
