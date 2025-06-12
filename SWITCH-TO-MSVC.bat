@echo off
REM Cambiar Rust de GNU a MSVC toolchain (no requiere admin)
echo ===========================================
echo    Configurando Rust para MSVC
echo ===========================================
echo.

REM Verificar si rustup está instalado
where rustup >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Rustup no encontrado en PATH
    echo Intentando con ruta completa...
    set RUSTUP=%USERPROFILE%\.cargo\bin\rustup.exe
) else (
    set RUSTUP=rustup
)

echo Toolchain actual:
%RUSTUP% show

echo.
echo Cambiando a MSVC toolchain...
%RUSTUP% default stable-x86_64-pc-windows-msvc
%RUSTUP% component add rust-src

echo.
echo Nuevo toolchain:
%RUSTUP% show

echo.
echo [OK] Configuracion completada
echo.
echo Ahora ejecuta BUILD-DISKDOMINATOR.bat
pause