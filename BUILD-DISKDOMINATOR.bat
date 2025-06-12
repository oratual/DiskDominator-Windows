@echo off
REM DiskDominator Build Script for Windows
REM Ejecutable desde WSL con: cmd.exe /c "K:\\_Glados\\DiskDominator\\BUILD-DISKDOMINATOR.bat"

echo ===========================================
echo    DiskDominator Build Script
echo ===========================================
echo.

cd /d K:\_Glados\DiskDominator

REM Verificar Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no encontrado
    echo Instalar desde: https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [OK] Node.js %NODE_VERSION% instalado

REM Verificar Rust
where rustc >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Rust no encontrado
    echo Instalar desde: https://rustup.rs/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('rustc --version') do set RUST_VERSION=%%i
echo [OK] Rust %RUST_VERSION% instalado

echo.
echo Creando Cargo.toml simplificado...

REM Crear Cargo.toml
(
echo [package]
echo name = "disk-dominator"
echo version = "0.1.0"
echo edition = "2021"
echo.
echo [build-dependencies]
echo tauri-build = { version = "1", features = [] }
echo.
echo [dependencies]
echo tauri = { version = "1", features = ["fs-all", "path-all", "os-all", "shell-open"] }
echo serde = { version = "1.0", features = ["derive"] }
echo serde_json = "1.0"
echo.
echo [features]
echo default = ["custom-protocol"]
echo custom-protocol = ["tauri/custom-protocol"]
) > src-tauri\Cargo.toml

echo.
echo ===========================================
echo    Compilando aplicacion Tauri
echo ===========================================
echo.

REM Limpiar builds anteriores
if exist src-tauri\target\release (
    echo Limpiando builds anteriores...
    rmdir /s /q src-tauri\target\release
)

REM Ejecutar build
echo Ejecutando npm run tauri:build...
echo Esto puede tomar varios minutos...
echo.

npm run tauri:build

if %errorlevel% equ 0 (
    echo.
    echo ===========================================
    echo    BUILD EXITOSO!
    echo ===========================================
    echo.
    if exist src-tauri\target\release\disk-dominator.exe (
        echo Ejecutable creado en:
        echo src-tauri\target\release\disk-dominator.exe
        echo.
        echo Abriendo carpeta de salida...
        explorer src-tauri\target\release
    )
) else (
    echo.
    echo ===========================================
    echo    BUILD FALLO
    echo ===========================================
    echo.
    echo Ver errores arriba para mas detalles
)

echo.
pause