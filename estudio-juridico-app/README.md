# ⚖️ LexTrack — Sistema de Gestión de Casos Jurídicos

> Microsistema ligero de ingesta y gestión de expedientes procesales para estudios jurídicos.  
> Arquitectura Full Stack con **React + FastAPI + Google Sheets** como base de datos.  
> Presupuesto operativo: **$0** (100% servicios gratuitos).

---

## 📋 Índice

1. [Descripción General](#descripción-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Estructura del Proyecto](#estructura-del-proyecto)
4. [Requisitos Previos](#requisitos-previos)
5. [Instalación y Configuración](#instalación-y-configuración)
6. [Configuración de Google Cloud](#configuración-de-google-cloud)
7. [Variables de Entorno](#variables-de-entorno)
8. [Ejecución Local](#ejecución-local)
9. [Documentación de la API](#documentación-de-la-api)
10. [Modelos de Datos](#modelos-de-datos)
11. [Funcionalidades del Frontend](#funcionalidades-del-frontend)
12. [Flujo de Trabajo](#flujo-de-trabajo)
13. [Glosario](#glosario)

---

## Descripción General

**LexTrack** automatiza dos procesos críticos de un estudio jurídico:

| Proceso | Descripción |
|---|---|
| **Ingesta de casos** | Recibe datos mínimos del cliente (vía formulario web o WhatsApp) y crea automáticamente una ficha procesal en Google Sheets |
| **Gestión de expedientes** | Visualiza, filtra y ordena todos los casos con un **semáforo visual de vencimientos** (RF-01) para prevenir pérdida de plazos procesales |

### ¿Por qué Google Sheets como base de datos?

- **$0 de costo** de infraestructura de base de datos
- Los abogados ya conocen la interfaz de Sheets para editar fichas manualmente
- API robusta y bien documentada (Google Sheets API v4)
- Acceso simultáneo multiusuario sin configuración adicional
- Backup automático en la nube de Google

---

## Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                        USUARIO FINAL                            │
│          (Abogado / Secretario / Asistente Legal)               │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP (navegador)
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND — React + Vite                      │
│                     http://localhost:5173                       │
│                                                                 │
│  ┌─────────────┐   ┌──────────────┐   ┌──────────────────────┐ │
│  │   Navbar    │   │ CasosTable   │   │    IngestaForm       │ │
│  │ (navegación)│   │ (RF-01 Sem.) │   │   (formulario RD-02) │ │
│  └─────────────┘   └──────────────┘   └──────────────────────┘ │
│                         │                        │              │
│                    services/api.js (Axios)        │              │
└─────────────────────────┼────────────────────────┼─────────────┘
                          │ REST / JSON             │
                          ▼                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   BACKEND — FastAPI (Python)                    │
│                     http://localhost:8000                       │
│                                                                 │
│  ┌──────────────────┐     ┌─────────────────────────────────┐   │
│  │  Router /casos   │     │      Router /ingesta            │   │
│  │  GET, POST, PATCH│     │      POST (RD-02 → RD-01)       │   │
│  └────────┬─────────┘     └────────────┬────────────────────┘   │
│           │                            │                        │
│           └──────────┬─────────────────┘                        │
│                      │                                          │
│           ┌──────────▼──────────────┐                           │
│           │    sheets_service.py    │                           │
│           │  insertar_caso()        │                           │
│           │  obtener_casos()        │                           │
│           │  actualizar_estado()    │                           │
│           └──────────┬──────────────┘                           │
│                      │ gspread + google-auth                    │
└──────────────────────┼──────────────────────────────────────────┘
                       │ HTTPS / OAuth2 Service Account
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│               GOOGLE SHEETS API v4                              │
│                                                                 │
│   Hoja "Casos"                                                  │
│   ┌────────┬──────────┬──────────┬───────┬──────────────────┐  │
│   │id_caso │caratula  │nro_exped.│fuero  │fecha_vencimiento │  │
│   ├────────┼──────────┼──────────┼───────┼──────────────────┤  │
│   │CASO-001│Pérez c/  │12345/26  │Civil  │2026-09-05        │  │
│   │CASO-002│López s/  │67890/26  │Laboral│2026-09-12        │  │
│   └────────┴──────────┴──────────┴───────┴──────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Stack Tecnológico

| Capa | Tecnología | Versión | Propósito |
|---|---|---|---|
| Frontend UI | React | 18.3 | Interfaz de usuario |
| Frontend Build | Vite | 5.3 | Bundler y dev server |
| Frontend Estilos | TailwindCSS | 3.4 | Diseño utility-first |
| Frontend Íconos | Lucide React | 0.400 | Iconografía SVG |
| Frontend HTTP | Axios | 1.7 | Cliente REST |
| Backend Framework | FastAPI | 0.111 | API REST asíncrona |
| Backend Runtime | Python | 3.10+ | Lenguaje principal |
| Backend Validación | Pydantic | 2.7 | Modelos y validación |
| Backend Server | Uvicorn | 0.30 | ASGI server |
| Persistencia | Google Sheets | API v4 | Base de datos |
| Auth Google | gspread + google-auth | 6.1 / 2.30 | Service Account OAuth2 |

---

## Estructura del Proyecto

```
estudio-juridico-app/               ← Raíz del monorepo
│
├── README.md                       ← Este archivo
│
├── backend/                        ← Aplicación Python/FastAPI
│   ├── .env.example                ← Plantilla de variables de entorno
│   ├── credentials.json.example    ← Plantilla de Service Account
│   ├── requirements.txt            ← Dependencias Python
│   └── app/
│       ├── __init__.py
│       ├── main.py                 ← Entrypoint FastAPI, CORS, middlewares
│       ├── config.py               ← Carga de .env con python-dotenv
│       ├── database.py             ← Conexión gspread (singleton)
│       ├── routers/
│       │   ├── __init__.py
│       │   ├── casos.py            ← CRUD /api/v1/casos
│       │   └── ingesta.py          ← POST /api/v1/ingesta
│       ├── schemas/
│       │   ├── __init__.py
│       │   └── caso_schema.py      ← Modelos Pydantic RD-01 y RD-02
│       └── services/
│           ├── __init__.py
│           └── sheets_service.py   ← Lógica de acceso a Google Sheets
│
└── frontend/                       ← Aplicación React/Vite
    ├── index.html                  ← HTML base con SEO y Google Fonts
    ├── package.json                ← Dependencias npm
    ├── vite.config.js              ← Config Vite + proxy API
    ├── tailwind.config.js          ← Paleta personalizada navy/gold
    ├── postcss.config.js           ← PostCSS para Tailwind
    └── src/
        ├── main.jsx                ← Punto de entrada React
        ├── App.jsx                 ← Raíz: estado global + navegación
        ├── index.css               ← Estilos globales + clases reutilizables
        ├── components/
        │   ├── Navbar.jsx          ← Barra de navegación principal
        │   ├── CasosTable.jsx      ← Tabla de expedientes + semáforo RF-01
        │   └── IngestaForm.jsx     ← Formulario de ingesta de casos
        └── services/
            └── api.js              ← Cliente Axios centralizado
```

---

## Requisitos Previos

### Software

| Herramienta | Versión mínima | Verificación |
|---|---|---|
| Node.js | 18.x | `node --version` |
| Python | 3.10+ | `python --version` |
| pip | 23+ | `pip --version` |
| Cuenta Google | — | Necesaria para Sheets API |

### Servicios Google (gratuitos)

- [x] Cuenta de Google / Google Workspace
- [x] Proyecto en Google Cloud Console
- [x] Google Sheets API habilitada
- [x] Google Drive API habilitada
- [x] Service Account creada con credenciales descargadas

---

## Instalación y Configuración

### 1. Clonar / Descargar el proyecto

```bash
# Si usás git
git clone <url-del-repositorio>
cd estudio-juridico-app
```

### 2. Configurar el Backend

```bash
cd backend

# Crear entorno virtual (recomendado)
python -m venv venv

# Activar en Windows
venv\Scripts\activate

# Activar en Linux/macOS
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt
```

### 3. Configurar el Frontend

```bash
cd ../frontend
npm install
```

---

## Configuración de Google Cloud

Este es el paso más importante. Seguí cada instrucción con cuidado.

### Paso 1 — Crear proyecto en Google Cloud

1. Ir a [console.cloud.google.com](https://console.cloud.google.com)
2. Clic en **"Seleccionar proyecto"** → **"Nuevo proyecto"**
3. Nombre sugerido: `lextrack-estudio-juridico`
4. Clic en **"Crear"**

### Paso 2 — Habilitar APIs

1. En el menú lateral: **"APIs y servicios"** → **"Biblioteca"**
2. Buscar y habilitar **"Google Sheets API"** → Clic en **"Habilitar"**
3. Buscar y habilitar **"Google Drive API"** → Clic en **"Habilitar"**

### Paso 3 — Crear Service Account

1. Ir a **"APIs y servicios"** → **"Credenciales"**
2. Clic en **"+ Crear credenciales"** → **"Cuenta de servicio"**
3. Completar:
   - Nombre: `lextrack-service`
   - ID: (se completa automático)
   - Descripción: `Acceso a Google Sheets para LexTrack`
4. Clic en **"Crear y continuar"** → **"Listo"**

### Paso 4 — Descargar credenciales JSON

1. Clic sobre la service account recién creada
2. Pestaña **"Claves"** → **"Agregar clave"** → **"Crear nueva clave"**
3. Formato: **JSON** → Clic en **"Crear"**
4. Se descarga automáticamente un archivo `.json`
5. **Renombrar** ese archivo a `credentials.json`
6. **Copiar** a la carpeta `backend/` del proyecto

### Paso 5 — Crear y compartir la Google Sheet

1. Ir a [sheets.google.com](https://sheets.google.com)
2. Crear una nueva hoja en blanco
3. Darle un nombre: `LexTrack - Casos Jurídicos`
4. **Copiar el ID del Spreadsheet** desde la URL:
   ```
   https://docs.google.com/spreadsheets/d/[ESTE_ES_EL_ID]/edit
   ```
5. Clic en **"Compartir"** (botón superior derecho)
6. En el campo de correo, ingresar el **`client_email`** que está dentro del `credentials.json`
   - Ejemplo: `lextrack-service@lextrack-estudio-juridico.iam.gserviceaccount.com`
7. Rol: **"Editor"** → Clic en **"Compartir"**

> ⚠️ **IMPORTANTE**: Si el spreadsheet no está compartido con el `client_email`, el sistema dará error 403 (Forbidden).

### Paso 6 — Configurar variables de entorno

```bash
# Dentro de la carpeta backend/
cp .env.example .env
```

Editar el archivo `.env` con los valores reales:

```env
GOOGLE_SHEETS_SPREADSHEET_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms
GOOGLE_CREDENTIALS_PATH=credentials.json
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
SHEET_NAME_CASOS=Casos
```

---

## Variables de Entorno

### Backend (`backend/.env`)

| Variable | Descripción | Ejemplo | Requerida |
|---|---|---|---|
| `GOOGLE_SHEETS_SPREADSHEET_ID` | ID del Spreadsheet (de la URL de Sheets) | `1BxiMVs0XRA5...` | ✅ Sí |
| `GOOGLE_CREDENTIALS_PATH` | Ruta al archivo credentials.json | `credentials.json` | ✅ Sí |
| `CORS_ORIGINS` | Orígenes permitidos (separados por coma) | `http://localhost:5173` | ✅ Sí |
| `SHEET_NAME_CASOS` | Nombre de la hoja para casos | `Casos` | ❌ No (default: `Casos`) |
| `SHEET_NAME_INGESTA` | Nombre de hoja para ingestas (futuro) | `Ingesta` | ❌ No |

### Frontend (`frontend/.env` — opcional)

| Variable | Descripción | Default |
|---|---|---|
| `VITE_API_URL` | URL base del backend | `http://localhost:8000` |

---

## Ejecución Local

### Opción A — Con Docker (Recomendado 🚀)

La forma más rápida y sin instalar dependencias locales de Python o Node.js:

```bash
# En Windows:
start.bat

# En Linux / macOS:
chmod +x start.sh
./start.sh
```

El script verificará tus requisitos y credenciales, levantará ambos contenedores y abrirá tu navegador automáticamente en `http://localhost:3000`.

**Comandos Docker directos:**
```bash
# Construir y levantar en segundo plano
docker compose up -d --build

# Ver logs en tiempo real
docker compose logs -f

# Detener contenedores
docker compose down
```

---

### Opción B — Manual (Sin Docker)

#### 1. Iniciar el Backend

```bash
cd backend

# Con entorno virtual activado
uvicorn app.main:app --reload --port 8000
```

Salida esperada:
```
INFO  | Estudio Jurídico API iniciando...
INFO  | Uvicorn running on http://0.0.0.0:8000
INFO  | Application startup complete.
```

Interfaces disponibles:
- **API Base**: http://localhost:8000
- **Swagger UI** (documentación interactiva): http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

#### 2. Iniciar el Frontend

```bash
cd frontend
npm run dev
```

Salida esperada:
```
  VITE v5.3.4  ready in 312 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
```

Abrir en el navegador: **http://localhost:5173**

---

## Documentación de la API

La documentación interactiva completa está disponible en **http://localhost:8000/docs** (Swagger UI).

### Health Check

```http
GET /health
```

**Respuesta:**
```json
{
  "status": "ok",
  "service": "estudio-juridico-api",
  "version": "1.0.0"
}
```

---

### Módulo de Casos — `/api/v1/casos`

#### `GET /api/v1/casos` — Listar todos los casos

Retorna todos los expedientes almacenados en Google Sheets.

**Respuesta exitosa `200 OK`:**
```json
{
  "total": 2,
  "casos": [
    {
      "id_caso": "CASO-001",
      "caratula": "Pérez Juan c/ Transportes Rápidos S.A.",
      "nro_expediente": "12345/2026",
      "fuero": "Civil",
      "fecha_vencimiento": "2026-09-05",
      "tipo_plazo": "Perentorio",
      "estado_tramite": "Ingesta Recibida",
      "link_evidencia": "https://drive.google.com/...",
      "nombre_cliente": "Juan Carlos Pérez",
      "dni_cliente": "28456789",
      "domicilio_cliente": "Av. Corrientes 1234, CABA",
      "resumen_hecho": "Accidente de tránsito el 15/08/2026."
    }
  ]
}
```

---

#### `GET /api/v1/casos/{id_caso}` — Obtener un caso por ID

**Parámetro de ruta:**
- `id_caso` (string): Ej. `CASO-001`

**Respuesta exitosa `200 OK`:** objeto `CasoDB`

**Error `404 Not Found`:**
```json
{ "detail": "Caso 'CASO-999' no encontrado." }
```

---

#### `POST /api/v1/casos` — Crear caso con ficha completa

Inserta directamente una ficha completa RD-01 (para uso administrativo).

**Body (JSON):**
```json
{
  "id_caso": "CASO-010",
  "caratula": "López María c/ Empresa XYZ",
  "nro_expediente": "54321/2026",
  "fuero": "Laboral",
  "fecha_vencimiento": "2026-10-15",
  "tipo_plazo": "Ordinal",
  "estado_tramite": "En Revisión",
  "link_evidencia": "",
  "nombre_cliente": "María López",
  "dni_cliente": "32100456",
  "domicilio_cliente": "Calle Falsa 123, Córdoba",
  "resumen_hecho": "Despido sin causa justificada."
}
```

**Respuesta `201 Created`:** objeto `CasoDB` creado.

---

#### `PATCH /api/v1/casos/{id_caso}/estado` — Actualizar estado

Actualiza únicamente el campo `estado_tramite` de un caso existente.

**Parámetro de ruta:** `id_caso`  
**Query param:** `nuevo_estado` (string)

**Ejemplo:**
```http
PATCH /api/v1/casos/CASO-001/estado?nuevo_estado=Ficha%20Completada
```

**Respuesta `200 OK`:**
```json
{
  "id_caso": "CASO-001",
  "estado_tramite": "Ficha Completada",
  "mensaje": "Estado actualizado"
}
```

---

### Módulo de Ingesta — `/api/v1/ingesta`

#### `POST /api/v1/ingesta` — Registrar nueva ingesta

Recibe datos mínimos del cliente (RD-02), genera automáticamente un `id_caso` y una ficha inicial, y persiste en Google Sheets.

**Body (JSON) — Modelo `IngestaCreate` (RD-02):**
```json
{
  "nombre_completo": "Juan Carlos Pérez",
  "dni": "28456789",
  "domicilio_real": "Av. Corrientes 1234, CABA",
  "resumen_hecho": "Accidente de tránsito el 15/08/2026 en Av. 9 de Julio. El cliente fue embestido por un colectivo de la línea 60.",
  "link_evidencia_drive": "https://drive.google.com/drive/folders/1ABC..."
}
```

**Respuesta `201 Created` — Modelo `CasoDB` (RD-01) generado:**
```json
{
  "id_caso": "CASO-003",
  "caratula": "Pérez Juan Carlos s/ Sin Carátula Asignada",
  "nro_expediente": "PENDIENTE",
  "fuero": "Sin Asignar",
  "fecha_vencimiento": "2026-08-30",
  "tipo_plazo": "Sin Asignar",
  "estado_tramite": "Ingesta Recibida",
  "link_evidencia": "https://drive.google.com/drive/folders/1ABC...",
  "nombre_cliente": "Juan Carlos Pérez",
  "dni_cliente": "28456789",
  "domicilio_cliente": "Av. Corrientes 1234, CABA",
  "resumen_hecho": "Accidente de tránsito el 15/08/2026..."
}
```

**Error `500 Internal Server Error`:**
```json
{ "detail": "Error al registrar la ingesta: [descripción del error]" }
```

---

### Códigos de Estado HTTP

| Código | Significado | Cuándo ocurre |
|---|---|---|
| `200 OK` | Éxito general | GET, PATCH exitosos |
| `201 Created` | Recurso creado | POST exitoso |
| `404 Not Found` | Recurso no encontrado | ID de caso inexistente |
| `422 Unprocessable Entity` | Error de validación | Campos requeridos faltantes o mal formados |
| `500 Internal Server Error` | Error del servidor | Problemas de conexión con Google Sheets |

---

## Modelos de Datos

### RD-02 — `IngestaCreate` (Datos Mínimos de Ingesta)

Datos recolectados al primer contacto con el cliente (WhatsApp, formulario, etc.).

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `nombre_completo` | `str` | ✅ | Nombre y apellido del cliente |
| `dni` | `str` | ✅ | DNI o documento de identidad |
| `domicilio_real` | `str` | ✅ | Domicilio real del cliente |
| `resumen_hecho` | `str` | ✅ | Descripción breve del hecho o caso |
| `link_evidencia_drive` | `str` | ❌ | URL de carpeta de Google Drive con evidencias |

### RD-01 — `CasoDB` (Ficha Completa del Expediente)

Ficha procesal completa almacenada en Google Sheets. Se genera parcialmente desde RD-02 y el abogado completa los campos procesales.

| Campo | Tipo | Descripción | Valores posibles |
|---|---|---|---|
| `id_caso` | `str` | Identificador único autogenerado | `CASO-001`, `CASO-002`... |
| `caratula` | `str` | Carátula del expediente judicial | Texto libre |
| `nro_expediente` | `str` | Número asignado por el juzgado | `12345/2026`, `PENDIENTE` |
| `fuero` | `str` | Fuero judicial | `Civil`, `Laboral`, `Familia`, `Penal`, `Comercial` |
| `fecha_vencimiento` | `str` | Fecha límite en formato ISO | `YYYY-MM-DD` |
| `tipo_plazo` | `str` | Tipo de plazo procesal | `Perentorio`, `Ordinal`, `Sin Asignar` |
| `estado_tramite` | `str` | Estado actual del caso | Ver tabla abajo |
| `link_evidencia` | `str` | URL de Drive con documentos | URL o cadena vacía |
| `nombre_cliente` | `str` | Nombre del cliente (de RD-02) | Texto libre |
| `dni_cliente` | `str` | DNI del cliente (de RD-02) | Numérico como texto |
| `domicilio_cliente` | `str` | Domicilio (de RD-02) | Texto libre |
| `resumen_hecho` | `str` | Resumen del hecho (de RD-02) | Texto libre |

#### Estados posibles del trámite

| Estado | Descripción |
|---|---|
| `Ingesta Recibida` | Estado inicial al registrar una ingesta |
| `Pendiente Documentación` | Esperando documentos del cliente |
| `En Revisión` | El abogado está analizando el caso |
| `Ficha Completada` | Caso completamente cargado y procesado |

### Estructura de la hoja "Casos" en Google Sheets

| A | B | C | D | E | F | G | H | I | J | K | L |
|---|---|---|---|---|---|---|---|---|---|---|---|
| id_caso | caratula | nro_expediente | fuero | fecha_vencimiento | tipo_plazo | estado_tramite | link_evidencia | nombre_cliente | dni_cliente | domicilio_cliente | resumen_hecho |

> La primera fila (encabezados) se crea automáticamente la primera vez que se inserta un caso.

---

## Funcionalidades del Frontend

### Navbar

- **Logo LexTrack** con ícono de balanza (Scale de Lucide)
- **Navegación** entre Expedientes e Ingesta
- **Indicador de estado API**: muestra si el backend está conectado o no (verde/rojo)
- **Menú hamburguesa** para dispositivos móviles

### Página: Expedientes (`CasosTable`)

- **Resumen estadístico** en 3 tarjetas: total de casos, casos críticos (≤3 días), casos urgentes (≤7 días)
- **Barra de búsqueda**: filtra por ID, carátula, expediente o nombre del cliente
- **Filtro por fuero**: dropdown para filtrar por Civil, Laboral, etc.
- **Tabla sorteable**: clic en cualquier columna para ordenar ascendente/descendente
- **RF-01 — Semáforo Visual de Vencimientos**:
  - 🔴 **Rojo**: vence en 3 días o menos (crítico)
  - 🟡 **Amarillo**: vence en 4 a 7 días (urgente)
  - 🟢 **Verde**: vence en más de 7 días (normal)
- **Badges de estado** con colores diferenciados por estado del trámite
- **Links a evidencia**: enlace directo a Google Drive
- **Botón de actualización** con ícono animado mientras carga
- **Estado vacío**: mensaje y ícono cuando no hay casos

### Página: Nueva Ingesta (`IngestaForm`)

- **Formulario de 5 campos** correspondientes al modelo RD-02
- **Validación en tiempo real** con mensajes de error por campo
- **Estado de carga** con spinner animado durante el envío
- **Pantalla de éxito** tras registro exitoso mostrando el ID asignado
- **Pantalla de error** con mensaje descriptivo si el backend no responde
- **Panel informativo** explicando el flujo de trabajo al pie del formulario
- **Botones**: Limpiar formulario / Registrar Ingesta / Nueva Ingesta / Ver Expedientes

---

## Flujo de Trabajo

### Flujo A — Ingesta desde WhatsApp/Formulario

```
Cliente contacta → Abogado recibe datos → Abre IngestaForm
        ↓
Completa: nombre, DNI, domicilio, resumen del hecho, link Drive
        ↓
Frontend envía POST /api/v1/ingesta (payload RD-02)
        ↓
Backend genera id_caso (CASO-NNN) + crea CasoDB con estado "Ingesta Recibida"
        ↓
sheets_service.py escribe nueva fila en Google Sheets
        ↓
Frontend muestra pantalla de éxito con ID asignado
        ↓
Abogado completa la ficha procesal directamente en Google Sheets
```

### Flujo B — Seguimiento de Vencimientos

```
Abogado abre el Dashboard → CasosTable carga GET /api/v1/casos
        ↓
Sistema lee todas las filas de Google Sheets
        ↓
Frontend calcula días hasta vencimiento para cada caso
        ↓
Semáforo visual: 🔴 crítico | 🟡 urgente | 🟢 normal
        ↓
Abogado filtra/ordena → toma acciones sobre casos críticos
```

---

## Glosario

| Término | Definición |
|---|---|
| **RD-01** | Requerimiento de Datos 01: Ficha completa del expediente procesal |
| **RD-02** | Requerimiento de Datos 02: Datos mínimos de ingesta del cliente |
| **RF-01** | Requerimiento Funcional 01: Semáforo visual de vencimientos de plazos |
| **Caratula** | Nombre oficial del expediente en el sistema judicial (Ej: "García c/ López") |
| **Fuero** | División del poder judicial según materia (Civil, Laboral, Familia, Penal) |
| **Plazo Perentorio** | Plazo que una vez vencido hace perder el derecho de manera automática |
| **Plazo Ordinal** | Plazo de orden, su incumplimiento genera sanciones pero no pérdida del derecho |
| **Service Account** | Cuenta de servicio de Google Cloud para autenticación máquina-a-máquina |
| **gspread** | Librería Python para interactuar con Google Sheets API |
| **Singleton** | Patrón de diseño que garantiza una única instancia del cliente de Sheets |

---

## Licencia

MIT License — Libre para uso académico y comercial.

---

*Desarrollado para el curso de Práctica Profesionalizante I — ISPC, 2° año, 2do cuatrimestre 2026.*
