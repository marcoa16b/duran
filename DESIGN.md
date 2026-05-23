# Design System — Panadería Durán
> Instrucciones de estilo para replicar la UI en cualquier pantalla o componente nuevo.
> Pega este documento en el contexto del LLM antes de pedir cualquier pantalla.

---

## 1. Filosofía general

- **Dark-first**: toda la UI vive sobre fondos oscuros. No existe modo claro.
- **Densidad media**: información visible sin scroll excesivo, sin saturar.
- **Utilitario y limpio**: sin adornos innecesarios. Cada elemento tiene una función.
- **Consistencia estructural**: sidebar fija + topbar fija + área de contenido scrolleable.

---

## 2. Color tokens

Usa estas variables CSS en todos los componentes. Decláralas en `:root` o en el elemento raíz.

```css
:root {
  /* Backgrounds */
  --bg-app:        #111111;   /* Fondo raíz de la aplicación */
  --bg-sidebar:    #1a1a1a;   /* Sidebar y paneles secundarios */
  --bg-surface:    #1c1c1c;   /* Cards, paneles, stat cards */
  --bg-item:       #242424;   /* Items de lista, quick-access rows */
  --bg-item-hover: #2c2c2c;   /* Hover sobre items */
  --bg-divider:    #252525;   /* Líneas divisoras internas en listas */

  /* Borders */
  --border-subtle: #2a2a2a;   /* Bordes entre secciones (sidebar, topbar) */

  /* Text */
  --text-primary:   #ffffff;  /* Títulos principales, valores de stat */
  --text-secondary: #dddddd;  /* Texto de cuerpo, mensajes */
  --text-muted:     #888888;  /* Labels, timestamps, subtítulos */
  --text-hint:      #555555;  /* Íconos decorativos, flechas de navegación */
  --text-link:      #4da6ff;  /* Links, checkmarks de acción */

  /* Accent — Acción principal */
  --accent-primary:       #2563eb;  /* Botón primario (Actualizar, Guardar) */
  --accent-primary-hover: #1d4ed8;

  /* Semantic — Estado de íconos en stat cards */
  --icon-blue-bg:    #1e3a6e;
  --icon-blue-fg:    #4da6ff;

  --icon-orange-bg:  #5c2e1a;
  --icon-orange-fg:  #f87032;

  --icon-green-bg:   #0f3d2a;
  --icon-green-fg:   #2dbd7e;

  --icon-red-bg:     #3d0f0f;
  --icon-red-fg:     #e05555;

  --icon-purple-bg:  #2d1a5c;
  --icon-purple-fg:  #9b7ee8;

  /* Alert / Notification */
  --alert-bell:      #e09a2a;   /* Color del ícono de campana en alertas */
  --badge-danger:    #c0392b;   /* Badge rojo de conteo (ej: "8" alertas) */

  /* Navigation */
  --nav-active-bg:   #252525;
  --nav-active-text: #ffffff;
  --nav-text:        #aaaaaa;
  --nav-hover-bg:    #252525;
  --nav-hover-text:  #dddddd;
}
```

---

## 3. Tipografía

```css
/* Stack de fuente */
font-family: 'Inter', system-ui, sans-serif;

/* Escala */
--text-xs:   11px;   /* Timestamps, hints */
--text-sm:   12px;   /* Labels de stat cards, badges */
--text-base: 13px;   /* Texto de navegación, mensajes de alerta */
--text-md:   14px;   /* Texto general de cuerpo, quick-access names */
--text-lg:   15px;   /* Subtítulos de sidebar header */
--text-xl:   16px;   /* Títulos de panel (panel-title) */
--text-2xl:  22px;   /* Valores numéricos en stat cards */
--text-3xl:  26px;   /* Título de página (h1) */

/* Pesos */
--weight-normal:  400;
--weight-medium:  500;
--weight-semibold:600;
--weight-bold:    700;
```

**Reglas:**
- El `font-weight: 700` solo se usa en valores numéricos de stat cards y en el h1 de página.
- Los títulos de panel usan `font-weight: 600`.
- El texto de navegación usa `font-weight: 400` (activo: sin cambio de peso, cambia solo color/bg).

---

## 4. Espaciado y bordes

```css
/* Radios */
--radius-sm:  7px;   /* Botones, stat icon */
--radius-md:  8px;   /* Quick-access items */
--radius-lg: 10px;   /* Cards, panels */
--radius-xl: 12px;   /* Contenedor raíz de la app */
--radius-full: 50%;  /* Avatares, badges circulares */

/* Padding interno de componentes */
--pad-card:   18px;
--pad-stat:   16px 14px;
--pad-nav:    9px 18px;
--pad-topbar: 10px 24px;
--pad-content:24px;
--pad-quick:  14px 16px;
```

---

## 5. Estructura de layout

```
┌──────────────────────────────────────────────┐
│  SIDEBAR (220px fija)  │  MAIN (flex: 1)     │
│  ┌──────────────────┐  │  ┌────────────────┐ │
│  │  Logo + nombre   │  │  │    TOPBAR      │ │
│  ├──────────────────┤  │  ├────────────────┤ │
│  │  nav-items       │  │  │                │ │
│  │  (scroll si hay) │  │  │   CONTENT      │ │
│  ├──────────────────┤  │  │   (scrollable) │ │
│  │  Configuración   │  │  │                │ │
│  └──────────────────┘  │  └────────────────┘ │
└──────────────────────────────────────────────┘
```

- `display: flex; height: 100vh; overflow: hidden` en el contenedor raíz.
- Sidebar: `width: 220px; flex-shrink: 0`.
- Main: `flex: 1; display: flex; flex-direction: column`.
- Content: `flex: 1; overflow-y: auto; padding: var(--pad-content)`.

---

## 6. Componentes

### 6.1 Sidebar

```css
.sidebar {
  background: var(--bg-sidebar);
  border-right: 1px solid var(--border-subtle);
}
.sidebar-header {
  padding: 18px 16px;
  border-bottom: 1px solid var(--border-subtle);
  display: flex; align-items: center; gap: 10px;
}
.sidebar-logo {
  width: 36px; height: 36px; border-radius: 50%;
  background: #c0392b;  /* Color de marca — ajustar por cliente */
}
```

### 6.2 Nav items

```css
.nav-item {
  display: flex; align-items: center; gap: 10px;
  padding: var(--pad-nav);
  color: var(--nav-text);
  font-size: var(--text-base);
  cursor: pointer;
  transition: background 0.15s;
}
.nav-item:hover  { background: var(--nav-hover-bg); color: var(--nav-hover-text); }
.nav-item.active { background: var(--nav-active-bg); color: var(--nav-active-text); }
/* Íconos: 18px, Tabler Icons outline */
```

### 6.3 Stat cards

```css
.stat-card {
  background: var(--bg-surface);
  border-radius: var(--radius-lg);
  padding: var(--pad-stat);
  display: flex; align-items: center; gap: 12px;
}
.stat-icon {
  width: 40px; height: 40px;
  border-radius: var(--radius-sm);
  display: flex; align-items: center; justify-content: center;
  font-size: 20px;
}
.stat-label { font-size: var(--text-sm); color: var(--text-muted); }
.stat-value { font-size: var(--text-2xl); font-weight: var(--weight-bold); color: var(--text-primary); }
```

**Colores de stat icon por semántica:**

| Concepto          | `--icon-*-bg`       | `--icon-*-fg`  |
|-------------------|---------------------|----------------|
| Inventario/neutral| `--icon-blue-bg`    | `--icon-blue-fg` |
| Bajo stock/alerta | `--icon-orange-bg`  | `--icon-orange-fg` |
| Entradas/positivo | `--icon-green-bg`   | `--icon-green-fg` |
| Salidas/negativo  | `--icon-red-bg`     | `--icon-red-fg` |
| Vencimiento/fecha | `--icon-purple-bg`  | `--icon-purple-fg` |

### 6.4 Panel / Card

```css
.panel {
  background: var(--bg-surface);
  border-radius: var(--radius-lg);
  padding: var(--pad-card);
}
.panel-title {
  font-size: var(--text-xl);
  font-weight: var(--weight-semibold);
  color: var(--text-primary);
}
```

### 6.5 Alert items

```css
.alert-item {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 11px 0;
  border-bottom: 1px solid var(--bg-divider);
}
.alert-bell  { color: var(--alert-bell); font-size: 17px; }
.alert-msg   { font-size: var(--text-base); color: var(--text-secondary); line-height: 1.4; }
.alert-time  { font-size: var(--text-xs); color: var(--text-muted); margin-top: 3px; }
.alert-check { color: var(--text-link); font-size: 15px; }
```

### 6.6 Quick-access rows

```css
.quick-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: var(--pad-quick);
  background: var(--bg-item);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background 0.15s;
}
.quick-item:hover { background: var(--bg-item-hover); }

.quick-icon {
  width: 36px; height: 36px;
  border-radius: 7px;
  display: flex; align-items: center; justify-content: center;
  font-size: 18px;
}
.quick-name  { font-size: var(--text-md); font-weight: var(--weight-medium); color: var(--text-secondary); }
.quick-arrow { color: var(--text-hint); font-size: 16px; }
```

### 6.7 Badge de conteo

```css
.badge-count {
  background: var(--badge-danger);
  color: #fff;
  border-radius: 50%;
  width: 22px; height: 22px;
  display: flex; align-items: center; justify-content: center;
  font-size: var(--text-sm); font-weight: var(--weight-bold);
}
```

### 6.8 Botón primario

```css
.btn-primary {
  display: flex; align-items: center; gap: 7px;
  background: var(--accent-primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-sm);
  padding: 8px 16px;
  font-size: var(--text-base); font-weight: var(--weight-medium);
  cursor: pointer;
}
.btn-primary:hover { background: var(--accent-primary-hover); }
```

### 6.9 Topbar

```css
.topbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: var(--pad-topbar);
  border-bottom: 1px solid var(--border-subtle);
  background: var(--bg-app);
}
/* Lado derecho: email en --text-muted, botón logout en --text-secondary */
```

---

## 7. Grids recomendados

```css
/* Stat cards — 5 columnas en desktop, 2-3 en tablet */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
}

/* Contenido principal — 2 columnas iguales */
.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

/* Responsive breakpoint sugerido */
@media (max-width: 960px) {
  .stat-grid { grid-template-columns: repeat(3, 1fr); }
  .two-col   { grid-template-columns: 1fr; }
}
```

---

## 8. Íconos

Usa **Tabler Icons** (outline, nunca filled).

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css">

<!-- Uso -->
<i class="ti ti-box" aria-hidden="true"></i>
```

**Mapa de íconos del sistema:**

| Sección        | Ícono Tabler           |
|----------------|------------------------|
| Dashboard      | `ti-layout-dashboard`  |
| Productos      | `ti-box`               |
| Proveedores    | `ti-truck`             |
| Entradas       | `ti-login`             |
| Salidas        | `ti-logout`            |
| Recetas        | `ti-tools-kitchen-2`   |
| Producción     | `ti-assembly`          |
| Alertas        | `ti-bell`              |
| Estadísticas   | `ti-chart-bar`         |
| Reportes       | `ti-file-text`         |
| Configuración  | `ti-settings`          |
| Actualizar     | `ti-refresh`           |
| Modo oscuro    | `ti-moon`              |
| Cerrar sesión  | `ti-logout`            |

---

## 9. Reglas de diseño para el LLM

Al implementar cualquier pantalla nueva de esta app, seguir estas reglas sin excepción:

1. **Nunca usar fondos blancos o claros**. Todo es dark. `--bg-app` como base.
2. **No usar bordes gruesos**. Los bordes son siempre `1px solid var(--border-subtle)` o `1px solid var(--bg-divider)`.
3. **No usar sombras (`box-shadow`) decorativas**. Solo permitido en focus rings de inputs.
4. **No usar gradientes**. Fondos planos siempre.
5. **El sidebar siempre tiene 220px de ancho** y contiene logo, nav items y configuración al fondo.
6. **Los colores de ícono en stat cards siguen la semántica** de la tabla en §6.3. No asignar colores arbitrariamente.
7. **El único color de acción es `--accent-primary` (#2563eb)**. No introducir otros colores de acción.
8. **Los textos siguen la jerarquía**: primario → secundario → muted → hint. No saltar niveles.
9. **Los nav items no tienen indicador lateral** (sin borde izquierdo de color). El estado activo es solo `background: var(--nav-active-bg)` y `color: var(--nav-active-text)`.
10. **Quick-access rows siempre tienen flecha derecha** (`ti-chevron-right`) en `--text-hint`.
11. **Separadores en listas** son `border-bottom: 1px solid var(--bg-divider)`, nunca `<hr>` visible.
12. **Font size mínimo: 11px** (timestamps). Nunca menor.

---

## 10. Ejemplo de pantalla nueva (prompt de referencia)

Cuando pidas una pantalla nueva, usa este formato:

```
Crea la pantalla [NOMBRE] siguiendo el design system de Panadería Durán.
Estructura: sidebar fija 220px + topbar + contenido scrollable.
Colores: usar los tokens CSS definidos (--bg-app, --bg-surface, etc.).
Íconos: Tabler Icons outline.
Contenido específico: [describe aquí los datos, tabla, formulario, etc.].
```