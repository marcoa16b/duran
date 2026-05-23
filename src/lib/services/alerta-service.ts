import { prisma } from "@/lib/db";
import { NotFoundError } from "@/lib/errors";

export const AlertaService = {
  async detectarBajoStock() {
    const productos = await prisma.producto.findMany({
      where: { activo: true },
    });

    const tipoBajoStock = await prisma.tipo.findFirst({
      where: {
        nombre: "Bajo stock",
        list_tipo: { nombre: "alerta" },
        activo: true,
      },
    });

    if (!tipoBajoStock) return [];

    const nuevas: Array<{ id: number }> = [];

    for (const p of productos) {
      if (Number(p.stock_actual) <= Number(p.stock_minimo)) {
        const existente = await prisma.alertaInventario.findFirst({
          where: {
            producto_id: p.id,
            tipo_id: tipoBajoStock.id,
            leida: false,
            activo: true,
          },
        });
        if (existente) continue;

        const alerta = await prisma.alertaInventario.create({
          data: {
            tipo_id: tipoBajoStock.id,
            producto_id: p.id,
            mensaje: `Stock bajo: ${p.nombre} (${p.stock_actual} / ${p.stock_minimo} mínimo)`,
          },
        });
        nuevas.push(alerta);
      }
    }

    return nuevas;
  },

  async detectarProximosAVencer(diasLimite = 7) {
    const hoy = new Date();
    const limite = new Date(hoy.getTime() + diasLimite * 86400000);

    const tipoVencer = await prisma.tipo.findFirst({
      where: {
        nombre: "Próximo a vencer",
        list_tipo: { nombre: "alerta" },
        activo: true,
      },
    });

    if (!tipoVencer) return [];

    const lotes = await prisma.loteInventario.findMany({
      where: {
        fecha_vencimiento: { gte: hoy, lte: limite },
        activo: true,
      },
      include: { producto: true },
    });

    const nuevas: Array<{ id: number }> = [];

    for (const lote of lotes) {
      const existente = await prisma.alertaInventario.findFirst({
        where: {
          producto_id: lote.producto_id,
          tipo_id: tipoVencer.id,
          leida: false,
          activo: true,
          creado_en: { gte: hoy },
        },
      });
      if (existente) continue;

      const alerta = await prisma.alertaInventario.create({
        data: {
          tipo_id: tipoVencer.id,
          producto_id: lote.producto_id,
          mensaje: `Próximo a vencer: ${lote.producto.nombre} (lote: ${lote.codigo_lote ?? "N/A"}, vence: ${lote.fecha_vencimiento?.toLocaleDateString()})`,
        },
      });
      nuevas.push(alerta);
    }

    return nuevas;
  },

  async ejecutarDeteccionCompleta() {
    const bajoStock = await this.detectarBajoStock();
    const proximosVencer = await this.detectarProximosAVencer();
    return {
      bajo_stock: bajoStock.length,
      proximos_vencer: proximosVencer.length,
      total_nuevas: bajoStock.length + proximosVencer.length,
    };
  },

  async getAlertasActivas(onlyUnread = false) {
    return prisma.alertaInventario.findMany({
      where: {
        activo: true,
        ...(onlyUnread ? { leida: false } : {}),
      },
      include: {
        tipo: true,
        producto: { include: { unidad_medida: true } },
      },
      orderBy: [{ leida: "asc" }, { creado_en: "desc" }],
    });
  },

  async getAlertasByProducto(producto_id: number) {
    return prisma.alertaInventario.findMany({
      where: { producto_id, activo: true },
      include: { tipo: true },
      orderBy: { creado_en: "desc" },
    });
  },

  async marcarLeida(alerta_id: number) {
    const alerta = await prisma.alertaInventario.findUnique({
      where: { id: alerta_id, activo: true },
    });
    if (!alerta) throw new NotFoundError("Alerta no encontrada");

    await prisma.alertaInventario.update({
      where: { id: alerta_id },
      data: { leida: true, fecha_leida: new Date() },
    });
    return true;
  },

  async marcarTodasLeidas() {
    const result = await prisma.alertaInventario.updateMany({
      where: { activo: true, leida: false },
      data: { leida: true, fecha_leida: new Date() },
    });
    return result.count;
  },

  async countActivas() {
    return prisma.alertaInventario.count({
      where: { activo: true, leida: false },
    });
  },
};
