import type { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/db";
import { NotFoundError, ValidationError } from "@/lib/errors";

export const ProductoService = {
  async getById(producto_id: number) {
    const producto = await prisma.producto.findUnique({
      where: { id: producto_id, activo: true },
      include: { categoria_producto: true, unidad_medida: true },
    });
    if (!producto) throw new NotFoundError("Producto no encontrado");
    return producto;
  },

  async getAll(onlyActive = true) {
    return prisma.producto.findMany({
      where: onlyActive ? { activo: true } : {},
      include: { categoria_producto: true, unidad_medida: true },
      orderBy: { nombre: "asc" },
    });
  },

  async getPaginated(
    offset: number,
    limit: number,
    query?: string,
    categoria_id?: number,
  ) {
    const where: Prisma.ProductoWhereInput = { activo: true };
    if (query && query.length >= 2) {
      where.nombre = { contains: query, mode: "insensitive" };
    }
    if (categoria_id) {
      where.categoria_id = categoria_id;
    }
    const [data, total] = await Promise.all([
      prisma.producto.findMany({
        where,
        include: { categoria_producto: true, unidad_medida: true },
        skip: offset,
        take: limit,
        orderBy: { nombre: "asc" },
      }),
      prisma.producto.count({ where }),
    ]);
    return { data, total };
  },

  async search(query: string, onlyActive = true) {
    if (query.length < 2) return [];
    return prisma.producto.findMany({
      where: {
        activo: onlyActive,
        OR: [
          { nombre: { contains: query, mode: "insensitive" } },
          { descripcion: { contains: query, mode: "insensitive" } },
        ],
      },
      include: { unidad_medida: true },
      take: 20,
      orderBy: { nombre: "asc" },
    });
  },

  async getByCategoria(categoria_id: number) {
    return prisma.producto.findMany({
      where: { categoria_id, activo: true },
      include: { unidad_medida: true },
      orderBy: { nombre: "asc" },
    });
  },

  async create(data: {
    nombre: string;
    descripcion?: string;
    categoria_id: number;
    unidad_medida_id: number;
    stock_minimo?: number;
    ubicacion?: string;
  }) {
    if (!data.nombre || data.nombre.length < 2) {
      throw new ValidationError("El nombre debe tener al menos 2 caracteres");
    }
    const categoria = await prisma.categoriaProducto.findUnique({
      where: { id: data.categoria_id, activo: true },
    });
    if (!categoria) throw new ValidationError("Categoría no encontrada");

    const unidad = await prisma.unidadMedida.findUnique({
      where: { id: data.unidad_medida_id, activo: true },
    });
    if (!unidad) throw new ValidationError("Unidad de medida no encontrada");

    return prisma.producto.create({
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        categoria_id: data.categoria_id,
        unidad_medida_id: data.unidad_medida_id,
        stock_minimo: data.stock_minimo ?? 0,
        ubicacion: data.ubicacion,
      },
      include: { categoria_producto: true, unidad_medida: true },
    });
  },

  async update(
    producto_id: number,
    data: {
      nombre?: string;
      descripcion?: string;
      categoria_id?: number;
      unidad_medida_id?: number;
      stock_minimo?: number;
      ubicacion?: string;
    },
  ) {
    const producto = await prisma.producto.findUnique({
      where: { id: producto_id, activo: true },
    });
    if (!producto) throw new NotFoundError("Producto no encontrado");

    return prisma.producto.update({
      where: { id: producto_id },
      data,
      include: { categoria_producto: true, unidad_medida: true },
    });
  },

  async deactivate(producto_id: number) {
    const producto = await prisma.producto.findUnique({
      where: { id: producto_id, activo: true },
    });
    if (!producto) throw new NotFoundError("Producto no encontrado");
    await prisma.producto.update({
      where: { id: producto_id },
      data: { activo: false },
    });
    return true;
  },

  async getCurrentStock(producto_id: number) {
    const producto = await prisma.producto.findUnique({
      where: { id: producto_id, activo: true },
      select: { stock_actual: true },
    });
    if (!producto) throw new NotFoundError("Producto no encontrado");
    return producto.stock_actual;
  },

  async getProductosBelowMinStock() {
    const productos = await prisma.producto.findMany({
      where: { activo: true },
      include: { categoria_producto: true, unidad_medida: true },
    });
    return productos.filter(
      (p) => Number(p.stock_actual) <= Number(p.stock_minimo),
    );
  },
};
