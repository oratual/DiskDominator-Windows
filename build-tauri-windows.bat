@echo off
echo ========================================
echo    DiskDominator - Tauri Build Script
echo ========================================
echo.

echo Verificando instalación de Tauri CLI...
call npx tauri --version
if %errorlevel% neq 0 (
    echo ERROR: Tauri CLI no está instalado
    echo Instalando Tauri CLI v1...
    npm install -D @tauri-apps/cli@1
)

echo.
echo Construyendo aplicación para Windows...
echo.

REM Build for Windows
call npx tauri build

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo    ¡BUILD COMPLETADO CON ÉXITO!
    echo ========================================
    echo.
    echo El instalador se encuentra en:
    echo src-tauri\target\release\bundle\msi\
    echo.
    echo El ejecutable se encuentra en:
    echo src-tauri\target\release\disk-dominator.exe
    echo.
) else (
    echo.
    echo ========================================
    echo    ERROR EN EL BUILD
    echo ========================================
    echo.
    echo Por favor revisa los mensajes de error arriba
    echo.
)

pause