import { prisma } from "@/lib/db";

export const ReporteService = {
  async getResumenDashboard() {
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const in7Days = new Date(now.getTime() + 7 * 86400000);

    const [
      totalProductos,
      entradasMes,
      salidasMes,
      lotesPorVencer,
      alertasNoLeidas,
    ] = await Promise.all([
      prisma.producto.count({ where: { activo: true } }),
      prisma.entradaInventario.count({
        where: { fecha: { gte: firstOfMonth }, activo: true },
      }),
      prisma.salidaInventario.count({
        where: { fecha: { gte: firstOfMonth }, activo: true },
      }),
      prisma.loteInventario.count({
        where: {
          fecha_vencimiento: { gte: now, lte: in7Days },
          activo: true,
        },
      }),
      prisma.alertaInventario.count({
        where: { leida: false, activo: true },
      }),
    ]);

    const productos = await prisma.producto.findMany({
      where: { activo: true },
      select: { stock_actual: true, stock_minimo: true },
    });
    const productosBajoStock = productos.filter(
      (p) => Number(p.stock_actual) <= Number(p.stock_minimo),
    ).length;

    return {
      totalProductos,
      productosBajoStock,
      entradasMes,
      salidasMes,
      lotesPorVencer,
      alertasNoLeidas,
    };
  },

  async getExistenciasActuales() {
    return prisma.producto.findMany({
      where: { activo: true },
      include: { categoria_producto: true, unidad_medida: true },
      orderBy: { nombre: "asc" },
    });
  },

  async getPerdidas(fechaInicio: Date, fechaFin: Date) {
    const tiposPerdida = await prisma.tipo.findMany({
      where: {
        list_tipo: { nombre: "salida" },
        nombre: { in: ["Dañado", "Vencido"] },
        activo: true,
      },
    });
    const tipoIds = tiposPerdida.map((t) => t.id);

    const salidas = await prisma.salidaInventario.findMany({
      where: {
        tipo_id: { in: tipoIds },
        fecha: { gte: fechaInicio, lte: fechaFin },
        activo: true,
      },
      include: {
        tipo: true,
        detalles: {
          where: { activo: true },
          include: { lote: { include: { producto: true } } },
        },
      },
      orderBy: { fecha: "desc" },
    });

    const totalPerdido = salidas.reduce(
      (sum, s) =>
        sum + s.detalles.reduce((dSum, d) => dSum + Number(d.cantidad), 0),
      0,
    );

    return { salidas, totalPerdido, tipoPerdida: tiposPerdida };
  },

  async getEntradasPeriodo(fechaInicio: Date, fechaFin: Date) {
    return prisma.entradaInventario.findMany({
      where: { fecha: { gte: fechaInicio, lte: fechaFin }, activo: true },
      include: {
        tipo: true,
        proveedor: true,
        lotes: {
          where: { activo: true },
          include: { producto: { include: { unidad_medida: true } } },
        },
      },
      orderBy: { fecha: "desc" },
    });
  },

  async getSalidasPeriodo(fechaInicio: Date, fechaFin: Date) {
    return prisma.salidaInventario.findMany({
      where: { fecha: { gte: fechaInicio, lte: fechaFin }, activo: true },
      include: {
        tipo: true,
        detalles: {
          where: { activo: true },
          include: { lote: { include: { producto: true } } },
        },
      },
      orderBy: { fecha: "desc" },
    });
  },

  async getExistenciasPorCategoria() {
    const categorias = await prisma.categoriaProducto.findMany({
      where: { activo: true },
      include: {
        productos: {
          where: { activo: true },
          include: { unidad_medida: true },
        },
      },
      orderBy: { nombre: "asc" },
    });

    return categorias.map((cat) => ({
      id: cat.id,
      nombre: cat.nombre,
      total_productos: cat.productos.length,
      productos: cat.productos,
    }));
  },

  async getMovimientosRecientes(limite = 10) {
    const [entradas, salidas] = await Promise.all([
      prisma.entradaInventario.findMany({
        where: { activo: true },
        include: { tipo: true, _count: { select: { lotes: true } } },
        orderBy: { creado_en: "desc" },
        take: limite,
      }),
      prisma.salidaInventario.findMany({
        where: { activo: true },
        include: { tipo: true, _count: { select: { detalles: true } } },
        orderBy: { creado_en: "desc" },
        take: limite,
      }),
    ]);

    const movimientos = [
      ...entradas.map((e) => ({
        id: e.id,
        tipo: "entrada" as const,
        tipo_nombre: e.tipo.nombre,
        fecha: e.fecha,
        detalle: `${e._count.lotes} lote(s)`,
        creado_en: e.creado_en,
      })),
      ...salidas.map((s) => ({
        id: s.id,
        tipo: "salida" as const,
        tipo_nombre: s.tipo.nombre,
        fecha: s.fecha,
        detalle: `${s._count.detalles} detalle(s)`,
        creado_en: s.creado_en,
      })),
    ];

    movimientos.sort((a, b) => b.creado_en.getTime() - a.creado_en.getTime());
    return movimientos.slice(0, limite);
  },

  async getConsumoAnual(year?: number) {
    const targetYear = year ?? new Date().getFullYear();
    const startDate = new Date(targetYear, 0, 1);
    const endDate = new Date(targetYear + 1, 0, 1);

    const productos = await prisma.producto.findMany({
      where: { activo: true },
      include: { unidad_medida: true },
    });

    const result = [];
    for (const p of productos) {
      const lotes = await prisma.loteInventario.findMany({
        where: { producto_id: p.id, activo: true },
      });
      const loteIds = lotes.map((l) => l.id);

      const agg = await prisma.detalleSalidaInventario.aggregate({
        where: {
          lote_id: { in: loteIds },
          activo: true,
          salida: {
            fecha: { gte: startDate, lt: endDate },
            activo: true,
          },
        },
        _sum: { cantidad: true },
      });

      result.push({
        producto_id: p.id,
        producto_nombre: p.nombre,
        unidad: p.unidad_medida.abreviatura,
        total_consumido: Number(agg._sum.cantidad ?? 0),
      });
    }

    result.sort((a, b) => b.total_consumido - a.total_consumido);
    return result;
  },
};
