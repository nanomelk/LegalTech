# ⚡ Guía de Inicio Rápido — LexTrack

> Para tener el sistema corriendo en pocos minutos.

---

## 🚀 Opción 1: Levantar con Docker (Ultra Rápido)

Una vez que tengas `backend/.env` y `backend/credentials.json`:

```bash
# Windows
start.bat

# Linux / Mac
chmod +x start.sh
./start.sh
```
El script chequeará tus archivos, construirá las imágenes y abrirá `http://localhost:3000` automáticamente.

---

## 🛠️ Opción 2: Levantar Manualmente (Sin Docker)

### Paso 1 — Configurar Backend (3 minutos)

```bash
cd estudio-juridico-app/backend

# 1. Crear entorno virtual
python -m venv venv

# 2. Activarlo (Windows)
venv\Scripts\activate
# En Linux/Mac: source venv/bin/activate

# 3. Instalar dependencias
pip install -r requirements.txt

# 4. Configurar variables de entorno
copy .env.example .env
# En Linux/Mac: cp .env.example .env

# 5. Editar .env con tus valores:
#    GOOGLE_SHEETS_SPREADSHEET_ID=tu_id_aqui
#    GOOGLE_CREDENTIALS_PATH=credentials.json

# 6. Copiar tu credentials.json descargado de Google Cloud a esta carpeta
```

---

## Paso 2 — Configurar Frontend (1 minuto)

```bash
cd estudio-juridico-app/frontend

# Instalar dependencias (solo la primera vez)
npm install
```

---

## Paso 3 — Levantar los servicios

**Terminal 1 — Backend:**
```bash
cd estudio-juridico-app/backend
venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```

✅ Backend corriendo en: **http://localhost:8000**  
📚 Swagger UI en: **http://localhost:8000/docs**

---

**Terminal 2 — Frontend:**
```bash
cd estudio-juridico-app/frontend
npm run dev
```

✅ Frontend corriendo en: **http://localhost:5173**

---

## Paso 4 — Verificar que todo funciona

1. Abrir **http://localhost:5173** en el navegador
2. La Navbar debe mostrar 🟢 **"API Conectada"**
3. Ir a **"Nueva Ingesta"** y registrar un caso de prueba
4. Volver a **"Expedientes"** y verificar que aparece el caso
5. Abrir la Google Sheet y confirmar que la fila fue creada

---

## Resolución de Problemas Comunes

### ❌ Error 403 Forbidden al conectar con Sheets
**Causa:** El spreadsheet no está compartido con el `client_email`.  
**Solución:** Abrir la Sheet → Compartir → Agregar el `client_email` del `credentials.json` como Editor.

### ❌ API Desconectada en la Navbar
**Causa:** El backend no está corriendo.  
**Solución:** Verificar que el terminal con `uvicorn` no tenga errores y esté activo.

### ❌ Error al cargar módulos de Python
**Causa:** Las dependencias no están instaladas o el entorno virtual no está activado.  
**Solución:** Ejecutar `pip install -r requirements.txt` con el venv activado.

### ❌ SPREADSHEET_ID no configurado
**Causa:** El `.env` no fue creado o el ID está vacío.  
**Solución:** Copiar `.env.example` a `.env` y completar el `GOOGLE_SHEETS_SPREADSHEET_ID`.

### ❌ FileNotFoundError: credentials.json
**Causa:** El archivo de credenciales no está en la carpeta `backend/`.  
**Solución:** Descargar la clave JSON de la Service Account y copiarla como `credentials.json`.

---

## Estructura de la Google Sheet

Cuando se registre el primer caso, la hoja "Casos" se creará automáticamente con esta estructura:

| id_caso | caratula | nro_expediente | fuero | fecha_vencimiento | tipo_plazo | estado_tramite | link_evidencia | nombre_cliente | dni_cliente | domicilio_cliente | resumen_hecho |
|---|---|---|---|---|---|---|---|---|---|---|---|
| CASO-001 | ... | PENDIENTE | Sin Asignar | 2026-08-30 | Sin Asignar | Ingesta Recibida | ... | ... | ... | ... | ... |

> ✏️ El abogado puede editar directamente las celdas en Google Sheets para completar `caratula`, `nro_expediente`, `fuero`, `fecha_vencimiento` y `tipo_plazo`.
