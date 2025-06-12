@echo off
:: Verificar permisos de administrador
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo Este script necesita permisos de administrador.
    echo.
    echo Ejecutalo como administrador:
    echo 1. Click derecho en el archivo
    echo 2. "Ejecutar como administrador"
    echo.
    pause
    exit /b 1
)

echo ===========================================
echo    Instalando MinGW con permisos admin
echo ===========================================
echo.

:: Eliminar archivo de bloqueo si existe
if exist "C:\ProgramData\chocolatey\lib\fbdc0560aaa937379f34e7f76506ff3536773a52" (
    echo Eliminando archivo de bloqueo...
    del /f "C:\ProgramData\chocolatey\lib\fbdc0560aaa937379f34e7f76506ff3536773a52"
)

:: Instalar MinGW
echo Instalando MinGW...
choco install mingw -y --force

if %errorlevel% equ 0 (
    echo.
    echo ===========================================
    echo    MinGW instalado exitosamente!
    echo ===========================================
    echo.
    echo Ahora puedes ejecutar BUILD-WINDOWS.ps1
) else (
    echo.
    echo ===========================================
    echo    Error al instalar MinGW
    echo ===========================================
)

pause