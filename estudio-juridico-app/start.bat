@echo off
:: ═══════════════════════════════════════════════════════════════════
:: start.bat — Script de arranque local para LexTrack (Windows)
:: 
:: Uso:
::   start.bat          → Levantar servicios (build si es necesario)
::   start.bat --build  → Forzar rebuild de imágenes
::   start.bat --down   → Detener y eliminar contenedores
::   start.bat --logs   → Ver logs en tiempo real
::   start.bat --status → Ver estado de los contenedores
:: ═══════════════════════════════════════════════════════════════════

setlocal EnableDelayedExpansion
title LexTrack — Docker Manager

:: ── Colores (ANSI en terminales modernas) ──────────────────────
set "GREEN=[32m"
set "YELLOW=[33m"
set "RED=[31m"
set "CYAN=[36m"
set "BOLD=[1m"
set "RESET=[0m"

:: ── Banner ─────────────────────────────────────────────────────
echo.
echo %CYAN%%BOLD%  ██╗     ███████╗██╗  ██╗████████╗██████╗  █████╗  ██████╗██╗  ██╗%RESET%
echo %CYAN%%BOLD%  ██║     ██╔════╝╚██╗██╔╝╚══██╔══╝██╔══██╗██╔══██╗██╔════╝██║ ██╔╝%RESET%
echo %CYAN%%BOLD%  ██║     █████╗   ╚███╔╝    ██║   ██████╔╝███████║██║     █████╔╝ %RESET%
echo %CYAN%%BOLD%  ██║     ██╔══╝   ██╔██╗    ██║   ██╔══██╗██╔══██║██║     ██╔═██╗ %RESET%
echo %CYAN%%BOLD%  ███████╗███████╗██╔╝ ██╗   ██║   ██║  ██║██║  ██║╚██████╗██║  ██╗%RESET%
echo %CYAN%%BOLD%  ╚══════╝╚══════╝╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝%RESET%
echo %CYAN%                    Sistema de Gestion de Casos Juridicos%RESET%
echo.

:: ── Verificar Docker ───────────────────────────────────────────
docker --version >nul 2>&1
if errorlevel 1 (
    echo %RED%[ERROR]%RESET% Docker no esta instalado o no esta en el PATH.
    echo         Descargalo desde: https://www.docker.com/products/docker-desktop
    echo.
    pause
    exit /b 1
)

docker compose version >nul 2>&1
if errorlevel 1 (
    echo %RED%[ERROR]%RESET% Docker Compose no esta disponible.
    echo         Asegurate de tener Docker Desktop actualizado.
    echo.
    pause
    exit /b 1
)

echo %GREEN%[OK]%RESET% Docker detectado correctamente.

:: ── Verificar archivos requeridos ──────────────────────────────
echo.
echo %YELLOW%[CHECK]%RESET% Verificando archivos de configuracion...

if not exist "backend\.env" (
    echo %RED%[ERROR]%RESET% No se encontro backend\.env
    echo         Ejecuta: copy backend\.env.example backend\.env
    echo         Luego edita el archivo con tu GOOGLE_SHEETS_SPREADSHEET_ID
    echo.
    pause
    exit /b 1
)
echo %GREEN%  [OK]%RESET% backend\.env encontrado

if not exist "backend\credentials.json" (
    echo %RED%[ERROR]%RESET% No se encontro backend\credentials.json
    echo         Descarga las credenciales de tu Service Account de Google Cloud
    echo         y copialas como backend\credentials.json
    echo.
    pause
    exit /b 1
)
echo %GREEN%  [OK]%RESET% backend\credentials.json encontrado

:: ── Procesar argumentos ────────────────────────────────────────
set "ARG=%~1"

if "%ARG%"=="--down" goto :down
if "%ARG%"=="--logs" goto :logs
if "%ARG%"=="--status" goto :status
if "%ARG%"=="--build" goto :build_and_up
if "%ARG%"=="--help" goto :help

:: Comportamiento por defecto: levantar (sin rebuild forzado)
goto :up

:: ── Levantar servicios ─────────────────────────────────────────
:up
echo.
echo %CYAN%[INFO]%RESET% Levantando servicios LexTrack...
echo %CYAN%[INFO]%RESET% Si es la primera vez, el build puede tardar 3-5 minutos.
echo.
docker compose up -d
if errorlevel 1 (
    echo %RED%[ERROR]%RESET% Fallo al levantar los servicios. Revisa los logs:
    echo         docker compose logs
    pause
    exit /b 1
)
goto :success

:: ── Rebuild forzado ────────────────────────────────────────────
:build_and_up
echo.
echo %CYAN%[INFO]%RESET% Reconstruyendo imagenes y levantando servicios...
echo.
docker compose up --build -d
if errorlevel 1 (
    echo %RED%[ERROR]%RESET% Fallo el build. Revisa los logs:
    echo         docker compose logs
    pause
    exit /b 1
)
goto :success

:: ── Mensaje de éxito ───────────────────────────────────────────
:success
echo.
echo %GREEN%%BOLD%══════════════════════════════════════════════════════%RESET%
echo %GREEN%%BOLD%  ✓ LexTrack levantado correctamente!%RESET%
echo %GREEN%%BOLD%══════════════════════════════════════════════════════%RESET%
echo.
echo %BOLD%  Accesos:%RESET%
echo   %CYAN%Frontend (App):  %RESET%http://localhost:3000
echo   %CYAN%Backend  (API):  %RESET%http://localhost:8000
echo   %CYAN%Swagger  (Docs): %RESET%http://localhost:8000/docs
echo   %CYAN%Health Check:    %RESET%http://localhost:8000/health
echo.
echo %BOLD%  Comandos utiles:%RESET%
echo   Ver logs:       %YELLOW%start.bat --logs%RESET%
echo   Ver estado:     %YELLOW%start.bat --status%RESET%
echo   Detener todo:   %YELLOW%start.bat --down%RESET%
echo   Rebuild:        %YELLOW%start.bat --build%RESET%
echo.

:: Abrir el navegador automáticamente después de 3 segundos
echo %CYAN%[INFO]%RESET% Abriendo el navegador en 5 segundos...
timeout /t 5 /nobreak >nul
start "" "http://localhost:3000"
goto :eof

:: ── Detener servicios ──────────────────────────────────────────
:down
echo.
echo %YELLOW%[INFO]%RESET% Deteniendo y eliminando contenedores LexTrack...
docker compose down
echo %GREEN%[OK]%RESET% Servicios detenidos.
echo.
goto :eof

:: ── Ver logs ───────────────────────────────────────────────────
:logs
echo.
echo %CYAN%[INFO]%RESET% Mostrando logs en tiempo real (Ctrl+C para salir)...
echo.
docker compose logs -f
goto :eof

:: ── Ver estado ─────────────────────────────────────────────────
:status
echo.
echo %CYAN%[INFO]%RESET% Estado de los contenedores LexTrack:
echo.
docker compose ps
echo.
goto :eof

:: ── Ayuda ──────────────────────────────────────────────────────
:help
echo.
echo %BOLD%Uso:%RESET% start.bat [opcion]
echo.
echo %BOLD%Opciones:%RESET%
echo   (sin opcion)   Levantar servicios (build solo si es necesario)
echo   --build        Forzar rebuild de imagenes y levantar
echo   --down         Detener y eliminar contenedores
echo   --logs         Ver logs en tiempo real
echo   --status       Ver estado de contenedores
echo   --help         Mostrar esta ayuda
echo.
goto :eof

endlocal
