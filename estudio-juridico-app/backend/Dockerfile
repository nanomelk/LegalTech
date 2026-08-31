# ─────────────────────────────────────────────────────────────────
# Dockerfile — Backend FastAPI / LexTrack
# Multi-stage: instala dependencias en builder, copia solo lo necesario
# ─────────────────────────────────────────────────────────────────

# ── Etapa 1: Dependencias ────────────────────────────────────────
FROM python:3.11-slim AS builder

WORKDIR /build

# Instalar dependencias de sistema mínimas
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copiar solo requirements primero (aprovecha cache de capas)
COPY requirements.txt .

# Instalar en directorio propio para copiar después
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt


# ── Etapa 2: Imagen de producción ────────────────────────────────
FROM python:3.11-slim AS production

# Metadatos de la imagen
LABEL maintainer="LexTrack"
LABEL description="Backend FastAPI — Sistema de Gestión de Casos Jurídicos"
LABEL version="1.0.0"

WORKDIR /app

# Copiar dependencias instaladas desde el builder
COPY --from=builder /install /usr/local

# Copiar código fuente
COPY app/ ./app/

# Variables de entorno con valores por defecto
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000

# Puerto que expone el contenedor
EXPOSE 8000

# Healthcheck: verifica que la API responde
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" \
    || exit 1

# Comando de inicio
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
