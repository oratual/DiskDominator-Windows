@echo off
echo ===========================================
echo    Solucion rapida para dlltool.exe
echo ===========================================
echo.
echo El error "dlltool.exe not found" ocurre porque
echo Rust esta usando el toolchain GNU pero faltan
echo las herramientas de MinGW.
echo.
echo Opciones:
echo.
echo 1. Instalar MinGW con Chocolatey (recomendado)
echo 2. Descargar MinGW manualmente
echo 3. Salir
echo.

choice /c 123 /n /m "Selecciona: "

if errorlevel 3 exit /b
if errorlevel 2 goto :manual
if errorlevel 1 goto :choco

:choco
echo.
echo Instalando MinGW con Chocolatey...
echo.

REM Verificar Chocolatey
where choco >nul 2>&1
if %errorlevel% neq 0 (
    echo Chocolatey no esta instalado.
    echo Instalalo desde: https://chocolatey.org/install
    echo.
    pause
    exit /b
)

choco install mingw -y
echo.
echo MinGW instalado. Reinicia la terminal y ejecuta BUILD-WINDOWS.ps1
pause
exit /b

:manual
echo.
echo Descarga MinGW desde:
echo https://www.mingw-w64.org/downloads/
echo.
echo O usa MSYS2:
echo https://www.msys2.org/
echo.
start https://www.mingw-w64.org/downloads/
pause
exit /b