# Durán Inventory System

Sistema de gestión de inventario para **Panadería Durán**, una panadería costarricense. Construido con Next.js 16, Prisma y PostgreSQL.

## Tech Stack

| Frontend | Backend | Database |
|---|---|---|
| Next.js 16 (App Router) | Prisma 7 ORM | PostgreSQL (Neon) |
| React 19 | Auth.js v5 (JWT) | — |
| Tailwind CSS 4 + shadcn/ui | Argon2 password hashing | — |
| TypeScript 5 | Zod validation | — |

## Módulos

| Módulo | Descripción |
|---|---|
| Dashboard | KPIs: total productos, bajo stock, entradas/salidas del mes, lotes por vencer |
| Productos | CRUD de productos con categorías y unidades de medida |
| Entradas | Registro de compras/donaciones con generación de lotes |
| Salidas | Registro de consumo, dañado, vencido con trazabilidad FIFO |
| Recetas | Definición de recetas con ingredientes y verificación de disponibilidad |
| Producción Diaria | Registro de producción con consumo FIFO de lotes |
| Alertas | Detección automática de bajo stock y próximos a vencer |
| Proveedores | CRUD de proveedores |
| Reportes | Existencias, pérdidas, consumo anual con exportación PDF/Excel |
| Configuración | Gestión de categorías, unidades de medida y perfil de usuario |

## Comandos

```bash
pnpm dev          # Iniciar desarrollo
pnpm build        # Build producción
pnpm lint         # Biome linter
pnpm format       # Biome formatter
pnpm db:migrate   # Prisma migrate
pnpm db:seed      # Poblar datos demo
pnpm db:push      # Sincronizar schema
```

## Credenciales demo

- **Correo:** `admin@panaderiaduran.com`
- **Contraseña:** `Admin123!`
