<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:project-context -->
# Project Context: Durán Inventory System

Inventory management system for *Panadería Durán*, a Costa Rican bakery. Built with Next.js 16 App Router.

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| Next.js (App Router) | 16.2.6 | Framework |
| React | 19.2.4 | UI library |
| TypeScript | 5.x | Language |
| Prisma | 7.8.0 | ORM (PostgreSQL) |
| Tailwind CSS | 4.x | Styling |
| shadcn/ui | base-vega style | UI primitives |
| lucide-react | 1.16.0 | Icons |
| @wrksz/themes | 0.9.2 | Dark/light mode |
| @base-ui/react | 1.5.0 | Headless UI primitives |
| Biome | 2.2.0 | Linter & formatter |
| class-variance-authority | 0.7.1 | Component variants |
| clsx + tailwind-merge | — | Class utilities |

## Code Formatting & Linting

- **Biome** handles both linting and formatting (NOT ESLint or Prettier)
- Config: `biome.json` — includes `next` and `react` recommended rules
- Commands: `pnpm lint` (biome check), `pnpm format` (biome format --write)
- `next lint` is **removed** in Next.js 16 — never use it
- Indent: 2 spaces

## Key Next.js 16 Breaking Changes

Always read `node_modules/next/dist/docs/` for the authoritative API before writing any Next.js code.

1. **`middleware.ts` → `proxy.ts`**: The `middleware` file convention is deprecated. Rename to `proxy.ts` at project root (or `src/`). Export a named `proxy` function (not `middleware`). Config flags like `skipMiddlewareUrlNormalize` → `skipProxyUrlNormalize`.

2. **Async Request APIs**: `params`, `searchParams`, `cookies()`, `headers()`, `draftMode()` are Promises. Always `await` them:
   ```tsx
   export default async function Page({ params }: { params: Promise<{ id: string }> }) {
     const { id } = await params;
   }
   ```

3. **Turbopack by default**: `next dev` and `next build` use Turbopack automatically. No `--turbopack` flag needed. `next.config.ts` uses top-level `turbopack: {}` (not `experimental.turbopack`).

4. **`cacheLife` / `cacheTag`** are stable — never use `unstable_` prefix.

5. **`revalidateTag(tag, lifecycleProfile)`**: Requires a lifecycle profile string as second argument (e.g., `'max'`). Use `updateTag(tag)` in Server Actions for read-your-writes semantics.

6. **`refresh()`**: New API from `next/cache` — refreshes the client router from within a Server Action.

7. **Parallel routes**: All parallel route slots require explicit `default.js` files.

8. **React Compiler**: Config `reactCompiler: true` in `next.config.ts` is stable (not experimental).

## Project Structure

```
src/
├── app/
│   ├── layout.tsx                # Root layout (ThemeProvider, fonts, globals.css)
│   ├── page.tsx                  # Dashboard
│   ├── login/page.tsx
│   ├── recovery-password/page.tsx
│   ├── alertas/
│   ├── configuracion/
│   ├── entradas/
│   ├── estadisticas/
│   ├── produccion-diaria/
│   ├── productos/
│   ├── proveedores/
│   ├── recetas/
│   ├── reportes/
│   ├── salidas/
│   └── api/
│       ├── auth/[...nextauth]/
│       ├── alertas/
│       ├── catalogos/
│       ├── config/
│       ├── entradas/
│       ├── produccion/
│       ├── productos/
│       ├── proveedores/
│       ├── recetas/
│       ├── reportes/
│       └── salidas/
├── components/
│   ├── layout/                   # sidebar, header, dashboard-layout
│   ├── ui/                       # Shared UI primitives + shadcn/ui
│   └── providers/                # auth-provider
├── lib/
│   ├── services/                 # Business logic layer
│   ├── validations/              # Zod schemas
│   ├── db.ts                     # Prisma client singleton
│   ├── auth.ts                   # Auth.js / JWT helpers
│   ├── errors.ts                 # Custom error classes
│   └── utils.ts                  # class-variance-authority + tailwind-merge
├── hooks/                        # Custom React hooks
├── types/                        # TypeScript type augmentations
└── styles/
    └── globals.css               # Tailwind + shadcn/ui CSS variables
prisma/
├── schema.prisma                 # Database schema (20 tables)
├── migrations/                   # Prisma migrations
└── seed.ts                       # Seed data
```

## Database

- **Prisma ORM** with PostgreSQL (Neon, URL in `.env`)
- Schema: `prisma/schema.prisma` — 20 models defined
- Client output: `app/generated/prisma` (configured in schema)
- Config: `prisma.config.ts`, Adapter: `@prisma/adapter-pg`
- Seed script: `prisma/seed.ts` (run via `tsx`)
- Soft delete via `activo: boolean` on all tables — always filter with `where: { activo: true }` unless managing config

## shadcn/ui

- Style: `base-vega` (NOT the default new-york style)
- Icons: lucide
- Components are in `src/components/ui/`
- Install new components with: `pnpm dlx shadcn@latest add <component>`
- Already configured in `components.json`

## Coding Conventions

- **Server Components by default** — only add `'use client'` when interactivity is needed (event handlers, state, effects, browser APIs)
- **No comments in production code** — keep code self-documenting
- **Zod** for all form and API validation (schemas in `src/lib/validations/`)
- **React Hook Form** with `@hookform/resolvers/zod` for form state (used in some forms; plain `useState` is also acceptable)
- **Sonner** for toast notifications (already in shadcn/ui)
- **date-fns** with `es` locale for date formatting
- **Prisma `$transaction`** for all multi-table mutations (inventory entries/exits, production registration)
- **Custom error classes** in `src/lib/errors.ts`: `AppError`, `NotFoundError`, `ValidationError`, `DuplicateError`, `UnauthorizedError`
- **Auth.js v5** with JWT strategy and argon2 password verification
- **Soft delete** via `activo: boolean` — `where: { activo: true }` in queries, `data: { activo: false }` on delete
- **Decimal fields** use `Prisma.Decimal` (returned as `number` from JSON APIs)
- **Data fetching** in client components: `fetch()` inside `useCallback` + `useEffect`, re-fetch after mutations
- **Optimistic updates** for immediate UI feedback (header alerts counter, etc.)
<!-- END:project-context -->