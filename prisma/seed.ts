import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import * as argon2 from "argon2";
import { PrismaClient } from "@/app/generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? "",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  const _listTipoEntrada = await prisma.listTipo.create({
    data: {
      nombre: "entrada",
      descripcion: "Tipos de entrada de inventario",
      tipos: {
        create: [
          { nombre: "Compra", descripcion: "Compra a proveedor" },
          { nombre: "Donación", descripcion: "Donación recibida" },
          { nombre: "Ajuste positivo", descripcion: "Ajuste manual positivo" },
        ],
      },
    },
  });

  const _listTipoSalida = await prisma.listTipo.create({
    data: {
      nombre: "salida",
      descripcion: "Tipos de salida de inventario",
      tipos: {
        create: [
          { nombre: "Consumo", descripcion: "Consumo interno" },
          { nombre: "Dañado", descripcion: "Producto dañado" },
          { nombre: "Vencido", descripcion: "Producto vencido" },
          { nombre: "Ajuste negativo", descripcion: "Ajuste manual negativo" },
        ],
      },
    },
  });

  const _listTipoAlerta = await prisma.listTipo.create({
    data: {
      nombre: "alerta",
      descripcion: "Tipos de alerta de inventario",
      tipos: {
        create: [
          { nombre: "Bajo stock", descripcion: "Stock por debajo del mínimo" },
          {
            nombre: "Próximo a vencer",
            descripcion: "Producto próximo a vencer",
          },
        ],
      },
    },
  });

  const rolAdmin = await prisma.rol.create({
    data: {
      nombre: "Administrador",
      descripcion: "Acceso total al sistema",
    },
  });

  const contrasenaHash = await argon2.hash("Admin123!");
  await prisma.usuario.create({
    data: {
      nombre: "Administrador",
      correo: "admin@panaderiaduran.com",
      contrasena_hash: contrasenaHash,
      rol_id: rolAdmin.id,
    },
  });
  console.log("  ✔ Usuario admin: admin@panaderiaduran.com / Admin123!");

  const provincias = [
    {
      nombre: "San José",
      cantones: [
        {
          nombre: "San José",
          distritos: [
            "Carmen",
            "Merced",
            "Hospital",
            "Catedral",
            "Zapote",
            "San Francisco de Dos Ríos",
            "Uruca",
            "Mata Redonda",
            "Pavas",
            "Hatillo",
            "San Sebastián",
          ],
        },
        {
          nombre: "Escazú",
          distritos: ["Escazú", "San Antonio", "San Rafael"],
        },
        {
          nombre: "Desamparados",
          distritos: [
            "Desamparados",
            "San Miguel",
            "San Juan de Dios",
            "San Rafael Arriba",
            "San Antonio",
            "Frailes",
            "Patarrá",
            "San Cristóbal",
            "Rosario",
            "Damas",
            "San Rafael Abajo",
            "Gravilias",
            "Los Guido",
          ],
        },
        {
          nombre: "Moravia",
          distritos: ["San Vicente", "San Jerónimo", "La Trinidad"],
        },
      ],
    },
    {
      nombre: "Alajuela",
      cantones: [
        {
          nombre: "Alajuela",
          distritos: [
            "Alajuela",
            "San José",
            "Carrizal",
            "San Antonio",
            "Guácima",
            "San Isidro",
            "Sabanilla",
            "San Rafael",
            "Río Segundo",
            "Desamparados",
            "Turrúcares",
            "Tambor",
            "Garita",
            "Sarapiquí",
          ],
        },
        {
          nombre: "San Ramón",
          distritos: [
            "San Ramón",
            "Santiago",
            "San Juan",
            "Pital",
            "San Isidro",
            "Alfaro",
            "Volio",
            "Concepción",
            "Zapotal",
            "Peñas Blancas",
          ],
        },
      ],
    },
    {
      nombre: "Cartago",
      cantones: [
        {
          nombre: "Cartago",
          distritos: [
            "Oriental",
            "Occidental",
            "Carmen",
            "San Nicolás",
            "Aguacaliente",
            "Guadalupe",
            "Coris",
            "Tierra Blanca",
            "Dulce Nombre",
            "Llano Grande",
            "Quebradilla",
          ],
        },
        {
          nombre: "Paraíso",
          distritos: [
            "Paraíso",
            "Santiago",
            "Orosi",
            "Cachí",
            "Llanos de Santa Lucía",
          ],
        },
      ],
    },
    {
      nombre: "Heredia",
      cantones: [
        {
          nombre: "Heredia",
          distritos: [
            "Heredia",
            "Mercedes",
            "San Francisco",
            "Ulloa",
            "Varablanca",
            "Barva",
            "San José de la Montaña",
            "San Pedro",
            "San Pablo",
            "La Asunción",
          ],
        },
        {
          nombre: "Santo Domingo",
          distritos: [
            "Santo Domingo",
            "San Vicente",
            "San Miguel",
            "Paracito",
            "Tobosi",
            "París",
            "La Trinidad",
          ],
        },
      ],
    },
  ];

  for (const p of provincias) {
    const provincia = await prisma.provincia.create({
      data: { nombre: p.nombre },
    });
    for (const c of p.cantones) {
      const canton = await prisma.canton.create({
        data: { nombre: c.nombre, provincia_id: provincia.id },
      });
      for (const d of c.distritos) {
        await prisma.distrito.create({
          data: { nombre: d, canton_id: canton.id },
        });
      }
    }
  }
  console.log("  ✔ Datos geográficos insertados");

  const categorias = [
    "Harinas",
    "Lácteos",
    "Grasas",
    "Edulcorantes",
    "Huevos",
    "Levaduras",
    "Mejorantes",
    "Saborizantes",
    "Conservantes",
    "Producción",
  ];
  for (const nombre of categorias) {
    await prisma.categoriaProducto.create({ data: { nombre } });
  }
  console.log("  ✔ Categorías insertadas");

  const unidades = [
    { nombre: "Gramos", abreviatura: "g" },
    { nombre: "Kilogramos", abreviatura: "kg" },
    { nombre: "Litros", abreviatura: "L" },
    { nombre: "Mililitros", abreviatura: "ml" },
    { nombre: "Unidades", abreviatura: "unid" },
    { nombre: "Libras", abreviatura: "lb" },
    { nombre: "Galones", abreviatura: "gal" },
  ];
  for (const u of unidades) {
    await prisma.unidadMedida.create({ data: u });
  }
  console.log("  ✔ Unidades de medida insertadas");

  const [
    harinas,
    lacteos,
    grasas,
    edulcorantes,
    huevosC,
    levaduras,
    mejorantes,
  ] = await Promise.all(
    categorias.map((nombre) =>
      prisma.categoriaProducto.findUniqueOrThrow({ where: { nombre } }),
    ),
  );
  const [kg, L, ml, unid, _g] = await Promise.all(
    unidades.map((u) =>
      prisma.unidadMedida.findUniqueOrThrow({
        where: { abreviatura: u.abreviatura },
      }),
    ),
  );

  const productosData = [
    {
      nombre: "Harina de trigo 50 kg",
      categoria_id: harinas.id,
      unidad_medida_id: kg.id,
      stock_minimo: 100,
    },
    {
      nombre: "Harina integral",
      categoria_id: harinas.id,
      unidad_medida_id: kg.id,
      stock_minimo: 25,
    },
    {
      nombre: "Leche entera",
      categoria_id: lacteos.id,
      unidad_medida_id: L.id,
      stock_minimo: 20,
    },
    {
      nombre: "Leche descremada",
      categoria_id: lacteos.id,
      unidad_medida_id: L.id,
      stock_minimo: 10,
    },
    {
      nombre: "Mantequilla",
      categoria_id: grasas.id,
      unidad_medida_id: kg.id,
      stock_minimo: 10,
    },
    {
      nombre: "Margarina",
      categoria_id: grasas.id,
      unidad_medida_id: kg.id,
      stock_minimo: 15,
    },
    {
      nombre: "Azúcar blanca",
      categoria_id: edulcorantes.id,
      unidad_medida_id: kg.id,
      stock_minimo: 50,
    },
    {
      nombre: "Azúcar morena",
      categoria_id: edulcorantes.id,
      unidad_medida_id: kg.id,
      stock_minimo: 25,
    },
    {
      nombre: "Huevos",
      categoria_id: huevosC.id,
      unidad_medida_id: unid.id,
      stock_minimo: 200,
    },
    {
      nombre: "Levadura seca",
      categoria_id: levaduras.id,
      unidad_medida_id: kg.id,
      stock_minimo: 5,
    },
    {
      nombre: "Levadura fresca",
      categoria_id: levaduras.id,
      unidad_medida_id: kg.id,
      stock_minimo: 3,
    },
    {
      nombre: "Mejorante panadero",
      categoria_id: mejorantes.id,
      unidad_medida_id: kg.id,
      stock_minimo: 5,
    },
    {
      nombre: "Sal",
      categoria_id: mejorantes.id,
      unidad_medida_id: kg.id,
      stock_minimo: 10,
    },
    {
      nombre: "Esencia de vainilla",
      categoria_id: mejorantes.id,
      unidad_medida_id: ml.id,
      stock_minimo: 1000,
    },
  ];
  for (const p of productosData) {
    await prisma.producto.create({ data: p });
  }
  console.log("  ✔ Productos demo insertados");

  const proveedoresData = [
    {
      nombre: "Molinos de Costa Rica",
      telefono: "2256-7890",
      correo: "ventas@molinos.cr",
    },
    {
      nombre: "Dos Pinos",
      telefono: "2278-4567",
      correo: "ventas@dospinos.com",
    },
    {
      nombre: "Grupo Numar",
      telefono: "2234-5678",
      correo: "ventas@gnumar.com",
    },
    {
      nombre: "Huevos del Valle",
      telefono: "2245-6789",
      correo: "info@huevosdelvalle.cr",
    },
    {
      nombre: "Levaduras Centroamericanas",
      telefono: "2276-5432",
      correo: "ventas@levadurasca.com",
    },
  ];
  for (const p of proveedoresData) {
    await prisma.proveedor.create({ data: p });
  }
  console.log("  ✔ Proveedores demo insertados");

  console.log("\n✅ Seed completado exitosamente");
}

main()
  .catch((e) => {
    console.error("❌ Error durante el seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
