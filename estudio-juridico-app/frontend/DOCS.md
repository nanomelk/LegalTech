# ⚛️ Frontend — Documentación Técnica

Documentación interna del frontend React/Vite del sistema LexTrack.

---

## Árbol de Componentes

```
App.jsx                         ← Raíz: estado global, navegación, carga de datos
│
├── Navbar.jsx                  ← Barra de navegación persistente
│   ├── Logo + Nombre
│   ├── NavLinks (Expedientes / Nueva Ingesta)
│   ├── Indicador API Online/Offline
│   └── Menú Hamburguesa (móvil)
│
├── [pagina === 'casos']
│   └── CasosTable.jsx          ← Tabla principal de expedientes
│       ├── Header (título + botón actualizar)
│       ├── Stats Cards (Total / Críticos / Urgentes)
│       ├── Filtros (búsqueda + fuero)
│       └── Tabla con semáforo RF-01
│
└── [pagina === 'ingesta']
    └── IngestaForm.jsx         ← Formulario de carga de datos RD-02
        ├── Campos del formulario (5 campos)
        ├── Validación en tiempo real
        ├── Pantalla de éxito (post-submit)
        └── Pantalla de error (red/API)
```

---

## Componentes

### `App.jsx` — Raíz de la Aplicación

**Estado que gestiona:**
```javascript
pagina      // 'casos' | 'ingesta' — página activa
casos       // CasoDB[] — lista de expedientes cargados
loading     // boolean — carga en progreso
apiOnline   // boolean — estado de conexión con la API
```

**Lógica principal:**
- `cargarCasos()`: llama a `getCasos()`, actualiza estado, maneja errores de red
- `handleIngestaExito()`: callback que recibe el caso nuevo; si `irACasos=true`, navega y recarga
- `handleNavigate()`: cambia `pagina` y recarga casos si navega a la tabla
- `useEffect([cargarCasos])`: carga inicial al montar el componente

---

### `Navbar.jsx` — Barra de Navegación

**Props:**

| Prop | Tipo | Descripción |
|---|---|---|
| `activePage` | `string` | Página activa: `'casos'` o `'ingesta'` |
| `onNavigate` | `function(id)` | Callback de navegación |
| `apiOnline` | `boolean` | Estado de conexión con el backend |

**Características:**
- Sticky en top con `backdrop-blur` (glassmorphism)
- Links activos con borde `navy` y `box-shadow` glow
- Indicador API: verde con ícono `Wifi` / rojo con `WifiOff`
- Responsive: navbar horizontal en desktop, menú colapsable en móvil
- Animación `animate-fade-in` en apertura del menú móvil

---

### `CasosTable.jsx` — Tabla de Expedientes

**Props:**

| Prop | Tipo | Descripción |
|---|---|---|
| `casos` | `CasoDB[]` | Lista de expedientes a mostrar |
| `loading` | `boolean` | Muestra spinner si es `true` |
| `onRefresh` | `function()` | Callback al presionar "Actualizar" |

**Estado interno:**
```javascript
busqueda    // string — texto de búsqueda
filtroFuero // string — fuero seleccionado en dropdown
sortConfig  // { key: string, dir: 'asc'|'desc' }
```

**Lógica clave:**

#### RF-01 — Semáforo Visual de Vencimientos

```javascript
function diasHastaVencimiento(fechaISO) {
  // Diferencia en días entre hoy (00:00:00) y la fecha de vencimiento
  const hoy = new Date(); hoy.setHours(0,0,0,0);
  const vencimiento = new Date(fechaISO + 'T00:00:00');
  return Math.ceil((vencimiento - hoy) / (1000 * 60 * 60 * 24));
}

function getSemaforo(dias) {
  if (dias <= 3) → { clase: 'semaforo-rojo',     icono: AlertTriangle }
  if (dias <= 7) → { clase: 'semaforo-amarillo', icono: Clock         }
  else           → { clase: 'semaforo-verde',    icono: CheckCircle   }
}
```

Las clases CSS `semaforo-rojo`, `semaforo-amarillo` y `semaforo-verde` están definidas en `index.css` como `@layer components`.

#### Filtrado (useMemo)

```javascript
// Combina búsqueda de texto libre + filtro de fuero
casos
  .filter(c => matchBusqueda && matchFuero)
  .sort((a, b) => comparar por sortConfig.key y sortConfig.dir)
```

#### Ordenamiento

- Clic en encabezado de columna → alterna asc/desc
- Columnas ordenables: `id_caso`, `caratula`, `fuero`, `nro_expediente`, `fecha_vencimiento`, `tipo_plazo`, `estado_tramite`
- Ícono visual `ChevronUp`/`ChevronDown` indica el ordenamiento activo

**`EstadoBadge`** — Subcomponente interno:

```javascript
const ESTADO_ESTILOS = {
  'Ingesta Recibida':        'bg-blue-500/20   border-blue-500/40   text-blue-300',
  'Pendiente Documentación': 'bg-amber-500/20  border-amber-500/40  text-amber-300',
  'En Revisión':             'bg-purple-500/20 border-purple-500/40 text-purple-300',
  'Ficha Completada':        'bg-emerald-500/20 border-emerald-500/40 text-emerald-300',
}
```

---

### `IngestaForm.jsx` — Formulario de Ingesta

**Props:**

| Prop | Tipo | Descripción |
|---|---|---|
| `onExito` | `function(caso, irACasos?)` | Callback tras registro exitoso |

**Estado interno:**
```javascript
form      // { nombre_completo, dni, domicilio_real, resumen_hecho, link_evidencia_drive }
errores   // { [campo]: string } — errores de validación por campo
estado    // 'idle' | 'loading' | 'success' | 'error'
respuesta // CasoDB | null — datos del caso creado
msgError  // string — mensaje de error a mostrar
```

**Ciclo de vida del formulario:**

```
idle → (submit) → loading → success
                          → error → (resetear) → idle
```

**Validación `validar()`:**
- Campos requeridos: `nombre_completo`, `dni`, `domicilio_real`, `resumen_hecho`
- Campo opcional con validación: `link_evidencia_drive` debe empezar con `http`
- Setea errores por campo individualmente

**Renderizado condicional:**
- `estado === 'success'`: muestra tarjeta de éxito con ID asignado y botones de acción
- `estado === 'error'`: muestra alerta roja con mensaje del error
- `estado === 'loading'`: deshabilita botón y muestra spinner `Loader2`

---

### `services/api.js` — Cliente HTTP

Axios con `baseURL` configurable por variable de entorno `VITE_API_URL`.

**Interceptor de respuesta:**
```javascript
// Normaliza todos los errores a { status, mensaje }
error.response?.data?.detail || error.message || 'Error desconocido'
```

**Funciones exportadas:**

```javascript
getCasos()                          → { total, casos: CasoDB[] }
getCasoPorId(idCaso)                → CasoDB
crearCaso(caso)                     → CasoDB
actualizarEstadoCaso(id, estado)    → { id_caso, estado_tramite, mensaje }
crearIngesta(ingesta)               → CasoDB
```

---

## Sistema de Diseño (Design System)

### Paleta de Colores

Definida en `tailwind.config.js`:

| Token | Uso | Valor base |
|---|---|---|
| `navy-600` | Color primario de botones y acentos | `#3038d8` |
| `navy-700` | Hover/activo de elementos primarios | `#282ebf` |
| `navy-950` | Fondo del navbar y elementos oscuros | `#141556` |
| `gold-400` | Acentos dorados, logo | `#facc15` |
| `slate-950` | Fondo general de la página | `#0d1526` |

### Clases Reutilizables (`index.css` — `@layer components`)

```css
.glass-card      /* Tarjeta glassmorphism: bg translúcido + border sutil */
.btn-primary     /* Botón principal: gradiente navy + glow */
.btn-secondary   /* Botón secundario: borde translúcido */
.input-field     /* Campo de formulario: bg translúcido + focus ring */
.input-label     /* Etiqueta de campo: uppercase + tracking */
.badge           /* Badge de estado: pill con icono */
.tabla-legal     /* Estilos base de la tabla de expedientes */
.semaforo-rojo   /* RF-01: color rojo para vencimientos críticos */
.semaforo-amarillo /* RF-01: color ámbar para vencimientos urgentes */
.semaforo-verde  /* RF-01: color verde para vencimientos normales */
```

### Tipografía

- **Sans-serif**: Inter (Google Fonts) — cuerpo de texto, tablas, formularios
- **Serif**: Playfair Display (Google Fonts) — títulos de sección (h1, h2)

### Animaciones

```css
animate-fade-in   /* opacity 0→1 en 0.4s */
animate-slide-up  /* opacity 0→1 + translateY(20px→0) en 0.5s */
animate-spin      /* rotación continua (spinner de carga) */
```

---

## Proxy de Desarrollo (Vite)

En `vite.config.js` se configura un proxy para las rutas `/api`:

```javascript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8000',
      changeOrigin: true,
    }
  }
}
```

Esto permite que en desarrollo no haya problemas de CORS: el frontend en `localhost:5173` redirige automáticamente las llamadas a `/api/*` hacia `localhost:8000/api/*`.

---

## SEO

En `index.html`:
```html
<title>LexTrack – Gestión de Casos Jurídicos</title>
<meta name="description" content="Sistema de gestión de expedientes...">
```

Cada componente usa `id` únicos en elementos interactivos para testing:

| ID | Elemento |
|---|---|
| `nav-casos` | Link de navegación a Expedientes |
| `nav-ingesta` | Link de navegación a Ingesta |
| `btn-refrescar-casos` | Botón actualizar tabla |
| `busqueda-casos` | Input de búsqueda |
| `filtro-fuero` | Dropdown de fuero |
| `form-ingesta` | Formulario de ingesta |
| `campo-{key}` | Cada campo del formulario |
| `btn-enviar-ingesta` | Botón submit del formulario |
| `btn-limpiar-form` | Botón limpiar formulario |
| `btn-nueva-ingesta` | Botón nueva ingesta (pantalla éxito) |
| `btn-ver-expedientes` | Botón ir a tabla (pantalla éxito) |

---

## Scripts Disponibles

```bash
npm run dev      # Servidor de desarrollo con HMR en localhost:5173
npm run build    # Build de producción en /dist
npm run preview  # Preview del build de producción
```
