@echo off
echo ========================================
echo    DIAGNOSTICO COMPLETO DE BUILD
echo ========================================
echo.

REM Crear log con timestamp
set logfile=build-diagnose-%date:~-4%%date:~3,2%%date:~0,2%_%time:~0,2%%time:~3,2%.log
echo Log: %logfile%
echo.

echo === PASO 1: Verificar Next.js Build === | tee -a %logfile%
if exist "out" (
    echo ✓ Carpeta 'out' existe | tee -a %logfile%
    dir out | findstr /i "index.html" | tee -a %logfile%
) else if exist ".next" (
    echo ✓ Carpeta '.next' existe | tee -a %logfile%
) else (
    echo ✗ No hay build de Next.js | tee -a %logfile%
)
echo. | tee -a %logfile%

echo === PASO 2: Verificar Módulos Core === | tee -a %logfile%
for %%m in (auth-module i18n-module ai-module logger-module storage-module update-module) do (
    if exist "core-modules\%%m\Cargo.toml" (
        echo ✓ %%m existe | tee -a %logfile%
    ) else (
        echo ✗ %%m NO EXISTE | tee -a %logfile%
    )
)
echo. | tee -a %logfile%

echo === PASO 3: Info de Rust === | tee -a %logfile%
rustup show | tee -a %logfile%
echo. | tee -a %logfile%

echo === PASO 4: Verificar Tauri === | tee -a %logfile%
npx @tauri-apps/cli info 2>&1 | tee -a %logfile%
echo. | tee -a %logfile%

echo === PASO 5: Intentar build sin módulos === | tee -a %logfile%
echo Creando Cargo.toml temporal sin módulos locales...
copy src-tauri\Cargo.toml src-tauri\Cargo.toml.backup

REM Crear versión sin módulos locales
echo [package] > src-tauri\Cargo-simple.toml
echo name = "disk-dominator" >> src-tauri\Cargo-simple.toml
echo version = "0.1.0" >> src-tauri\Cargo-simple.toml
echo edition = "2021" >> src-tauri\Cargo-simple.toml
echo. >> src-tauri\Cargo-simple.toml
echo [build-dependencies] >> src-tauri\Cargo-simple.toml
echo tauri-build = { version = "1", features = [] } >> src-tauri\Cargo-simple.toml
echo. >> src-tauri\Cargo-simple.toml
echo [dependencies] >> src-tauri\Cargo-simple.toml
echo tauri = { version = "1", features = ["fs-all", "path-all", "os-all", "shell-open"] } >> src-tauri\Cargo-simple.toml
echo serde = { version = "1.0", features = ["derive"] } >> src-tauri\Cargo-simple.toml
echo serde_json = "1.0" >> src-tauri\Cargo-simple.toml
echo. >> src-tauri\Cargo-simple.toml
echo [features] >> src-tauri\Cargo-simple.toml
echo default = ["custom-protocol"] >> src-tauri\Cargo-simple.toml
echo custom-protocol = ["tauri/custom-protocol"] >> src-tauri\Cargo-simple.toml

echo. | tee -a %logfile%
echo === RESUMEN === | tee -a %logfile%
echo Para compilar sin los módulos faltantes: | tee -a %logfile%
echo 1. Renombra src-tauri\Cargo-simple.toml a Cargo.toml | tee -a %logfile%
echo 2. Ejecuta: npm run tauri:build | tee -a %logfile%
echo. | tee -a %logfile%
echo O ejecuta QUICK-BUILD-NO-MODULES.bat | tee -a %logfile%
echo. | tee -a %logfile%

pause