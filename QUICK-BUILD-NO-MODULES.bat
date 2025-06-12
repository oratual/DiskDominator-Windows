@echo off
echo ========================================
echo    BUILD RAPIDO SIN MODULOS
echo ========================================
echo.

echo Respaldando archivos originales...
copy src-tauri\Cargo.toml src-tauri\Cargo.toml.original 2>nul
copy Cargo.toml Cargo.toml.original 2>nul

echo Creando configuración simplificada...

REM Crear Cargo.toml simple para src-tauri
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

REM Eliminar workspace temporalmente
if exist Cargo.toml del Cargo.toml

echo.
echo Ejecutando build...
echo.

npm run tauri:build

set result=%errorlevel%

echo.
echo Restaurando archivos originales...
if exist src-tauri\Cargo.toml.original (
    move /y src-tauri\Cargo.toml.original src-tauri\Cargo.toml >nul
)
if exist Cargo.toml.original (
    move /y Cargo.toml.original Cargo.toml >nul
)

if %result% equ 0 (
    echo.
    echo ========================================
    echo    ¡BUILD EXITOSO!
    echo ========================================
    echo Ejecutable en: src-tauri\target\release\
    echo.
) else (
    echo.
    echo ========================================
    echo    ERROR EN BUILD
    echo ========================================
    echo Revisa los mensajes de error arriba
    echo.
)

pause