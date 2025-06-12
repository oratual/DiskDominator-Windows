@echo off
echo ========================================
echo    TEST TAURI BUILD
echo ========================================
echo.

echo 1. Verificando Rust toolchain...
rustup show
echo.

echo 2. Verificando Tauri CLI...
call npx @tauri-apps/cli info
echo.

echo 3. Intentando build simple...
echo.

REM Cambiar al directorio de src-tauri
cd src-tauri
echo Directorio actual: %CD%
echo.

echo 4. Ejecutando cargo build directamente...
cargo build --release

echo.
echo ========================================
echo Si cargo build funciona, el problema
echo es con la configuración de Tauri.
echo Si no, es un problema de Rust/deps.
echo ========================================
echo.
pause