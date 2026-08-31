# ─────────────────────────────────────────────────────────────────
# Dockerfile — Frontend React/Vite + Nginx / LexTrack
# Multi-stage:
#   Etapa 1 (builder): Compila con Node/Vite → genera /dist
#   Etapa 2 (prod):    Sirve /dist con nginx + proxy al backend
# ─────────────────────────────────────────────────────────────────

# ── Etapa 1: Build con Node ──────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar manifiestos de dependencias primero (cache de capas)
COPY package.json package-lock.json* ./

# Instalar dependencias (ci es más rápido y reproducible que install)
RUN npm ci --silent

# Copiar el resto del código fuente
COPY . .

# Construir para producción
# VITE_API_URL vacío → las llamadas /api/* se resuelven via nginx proxy
ENV VITE_API_URL=""
RUN npm run build


# ── Etapa 2: Servidor nginx ──────────────────────────────────────
FROM nginx:1.27-alpine AS production

LABEL maintainer="LexTrack"
LABEL description="Frontend React — Sistema de Gestión de Casos Jurídicos"
LABEL version="1.0.0"

# Copiar el build de React desde la etapa anterior
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuración personalizada de nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Puerto que expone el contenedor
EXPOSE 80

# Healthcheck: verifica que nginx responde
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:80/ || exit 1

# nginx se inicia en foreground (requerido por Docker)
CMD ["nginx", "-g", "daemon off;"]
