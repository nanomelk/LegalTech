#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
# start.sh — Script de arranque local para LexTrack (Linux / macOS)
#
# Uso:
#   ./start.sh           → Levantar servicios
#   ./start.sh --build   → Forzar rebuild de imágenes
#   ./start.sh --down    → Detener y eliminar contenedores
#   ./start.sh --logs    → Ver logs en tiempo real
#   ./start.sh --status  → Ver estado de los contenedores
#   ./start.sh --help    → Mostrar ayuda
# ═══════════════════════════════════════════════════════════════════

set -euo pipefail

# ── Colores ANSI ───────────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

# ── Funciones de logging ───────────────────────────────────────────
info()    { echo -e "${CYAN}[INFO]${RESET}  $*"; }
success() { echo -e "${GREEN}[OK]${RESET}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${RESET}  $*"; }
error()   { echo -e "${RED}[ERROR]${RESET} $*" >&2; }
die()     { error "$*"; exit 1; }

# ── Banner ─────────────────────────────────────────────────────────
banner() {
    echo ""
    echo -e "${CYAN}${BOLD}  ██╗     ███████╗██╗  ██╗████████╗██████╗  █████╗  ██████╗██╗  ██╗${RESET}"
    echo -e "${CYAN}${BOLD}  ██║     ██╔════╝╚██╗██╔╝╚══██╔══╝██╔══██╗██╔══██╗██╔════╝██║ ██╔╝${RESET}"
    echo -e "${CYAN}${BOLD}  ██║     █████╗   ╚███╔╝    ██║   ██████╔╝███████║██║     █████╔╝ ${RESET}"
    echo -e "${CYAN}${BOLD}  ██║     ██╔══╝   ██╔██╗    ██║   ██╔══██╗██╔══██║██║     ██╔═██╗ ${RESET}"
    echo -e "${CYAN}${BOLD}  ███████╗███████╗██╔╝ ██╗   ██║   ██║  ██║██║  ██║╚██████╗██║  ██╗${RESET}"
    echo -e "${CYAN}${BOLD}  ╚══════╝╚══════╝╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝${RESET}"
    echo -e "${CYAN}                   Sistema de Gestión de Casos Jurídicos${RESET}"
    echo ""
}

# ── Verificar prerequisitos ────────────────────────────────────────
check_prerequisites() {
    info "Verificando prerequisites..."

    if ! command -v docker &>/dev/null; then
        die "Docker no está instalado. Descargalo desde: https://www.docker.com"
    fi
    success "Docker $(docker --version | cut -d' ' -f3 | tr -d ',') detectado"

    if ! docker compose version &>/dev/null; then
        die "Docker Compose no está disponible. Actualizá Docker Desktop."
    fi
    success "Docker Compose detectado"

    if ! docker info &>/dev/null; then
        die "Docker daemon no está corriendo. Iniciá Docker Desktop primero."
    fi
    success "Docker daemon activo"
}

# ── Verificar archivos de configuración ───────────────────────────
check_config() {
    echo ""
    info "Verificando archivos de configuración..."

    if [[ ! -f "backend/.env" ]]; then
        die "No se encontró backend/.env\n\
         Ejecutá: cp backend/.env.example backend/.env\n\
         Luego editá el archivo con tu GOOGLE_SHEETS_SPREADSHEET_ID"
    fi
    success "backend/.env encontrado"

    if [[ ! -f "backend/credentials.json" ]]; then
        die "No se encontró backend/credentials.json\n\
         Descargá las credenciales de tu Service Account de Google Cloud\n\
         y copialas como backend/credentials.json"
    fi
    success "backend/credentials.json encontrado"
}

# ── Levantar servicios ─────────────────────────────────────────────
cmd_up() {
    local build_flag="${1:-}"
    echo ""
    if [[ "$build_flag" == "--build" ]]; then
        info "Reconstruyendo imágenes y levantando servicios..."
        docker compose up --build -d
    else
        info "Levantando servicios LexTrack..."
        info "Si es la primera vez, el build puede tardar 3-5 minutos."
        docker compose up -d
    fi
    show_success
}

# ── Mensaje de éxito ───────────────────────────────────────────────
show_success() {
    echo ""
    echo -e "${GREEN}${BOLD}══════════════════════════════════════════════════════${RESET}"
    echo -e "${GREEN}${BOLD}  ✓ LexTrack levantado correctamente!${RESET}"
    echo -e "${GREEN}${BOLD}══════════════════════════════════════════════════════${RESET}"
    echo ""
    echo -e "${BOLD}  Accesos:${RESET}"
    echo -e "  ${CYAN}Frontend (App): ${RESET} http://localhost:3000"
    echo -e "  ${CYAN}Backend  (API): ${RESET} http://localhost:8000"
    echo -e "  ${CYAN}Swagger  (Docs):${RESET} http://localhost:8000/docs"
    echo -e "  ${CYAN}Health Check:  ${RESET} http://localhost:8000/health"
    echo ""
    echo -e "${BOLD}  Comandos útiles:${RESET}"
    echo -e "  Ver logs:       ${YELLOW}./start.sh --logs${RESET}"
    echo -e "  Ver estado:     ${YELLOW}./start.sh --status${RESET}"
    echo -e "  Detener todo:   ${YELLOW}./start.sh --down${RESET}"
    echo -e "  Rebuild:        ${YELLOW}./start.sh --build${RESET}"
    echo ""

    # Abrir navegador (multiplataforma)
    info "Intentando abrir el navegador..."
    sleep 3
    if command -v xdg-open &>/dev/null; then
        xdg-open "http://localhost:3000" &>/dev/null &
    elif command -v open &>/dev/null; then
        open "http://localhost:3000"
    else
        info "Abrí manualmente: http://localhost:3000"
    fi
}

# ── Detener servicios ──────────────────────────────────────────────
cmd_down() {
    echo ""
    warn "Deteniendo y eliminando contenedores LexTrack..."
    docker compose down
    success "Servicios detenidos correctamente."
    echo ""
}

# ── Ver logs ───────────────────────────────────────────────────────
cmd_logs() {
    echo ""
    info "Mostrando logs en tiempo real (Ctrl+C para salir)..."
    echo ""
    docker compose logs -f
}

# ── Ver estado ─────────────────────────────────────────────────────
cmd_status() {
    echo ""
    info "Estado de los contenedores LexTrack:"
    echo ""
    docker compose ps
    echo ""
}

# ── Ayuda ──────────────────────────────────────────────────────────
cmd_help() {
    echo ""
    echo -e "${BOLD}Uso:${RESET} ./start.sh [opción]"
    echo ""
    echo -e "${BOLD}Opciones:${RESET}"
    echo "  (sin opción)   Levantar servicios (build solo si es necesario)"
    echo "  --build        Forzar rebuild de imágenes y levantar"
    echo "  --down         Detener y eliminar contenedores"
    echo "  --logs         Ver logs en tiempo real"
    echo "  --status       Ver estado de contenedores"
    echo "  --help         Mostrar esta ayuda"
    echo ""
}

# ── Main ───────────────────────────────────────────────────────────
main() {
    banner

    local cmd="${1:-}"

    case "$cmd" in
        --down)
            check_prerequisites
            cmd_down
            ;;
        --logs)
            check_prerequisites
            cmd_logs
            ;;
        --status)
            check_prerequisites
            cmd_status
            ;;
        --help|-h)
            cmd_help
            ;;
        --build)
            check_prerequisites
            check_config
            cmd_up "--build"
            ;;
        "")
            check_prerequisites
            check_config
            cmd_up
            ;;
        *)
            error "Opción desconocida: '$cmd'"
            cmd_help
            exit 1
            ;;
    esac
}

main "$@"
