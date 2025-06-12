@echo off
echo ==========================================
echo   DiskDominator Build con Visual Studio
echo ==========================================
echo.

REM Buscar vcvarsall.bat
set VCVARSALL=
if exist "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvarsall.bat" (
    set VCVARSALL=C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvarsall.bat
) else if exist "C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvarsall.bat" (
    set VCVARSALL=C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvarsall.bat
) else if exist "C:\Program Files (x86)\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvarsall.bat" (
    set VCVARSALL=C:\Program Files (x86)\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvarsall.bat
)

if "%VCVARSALL%"=="" (
    echo ERROR: No se encontró Visual Studio 2022
    echo Por favor instala Visual Studio Build Tools o Community
    pause
    exit /b 1
)

echo Configurando entorno de Visual Studio...
call "%VCVARSALL%" x64
echo.

echo Verificando herramientas...
where cl >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: cl.exe no encontrado después de configurar VS
    pause
    exit /b 1
)
echo ✓ Compilador C++ encontrado

echo.
echo Instalando Rust si no existe...
where rustup >nul 2>&1
if %errorlevel% neq 0 (
    echo Rust no encontrado. Descargando e instalando...
    echo.
    echo Por favor instala Rust desde: https://rustup.rs/
    echo Asegúrate de seleccionar "MSVC" como toolchain
    echo.
    pause
    exit /b 1
)

echo ✓ Rust encontrado
rustup default stable-msvc
rustup target add x86_64-pc-windows-msvc

echo.
echo ==========================================
echo   Ejecutando Build
echo ==========================================
echo.

REM Usar el Cargo.toml simplificado
copy src-tauri\Cargo.toml src-tauri\Cargo.toml.backup 2>nul
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

if exist Cargo.toml del Cargo.toml

npm run tauri:build

REM Restaurar archivo original
if exist src-tauri\Cargo.toml.backup (
    move /y src-tauri\Cargo.toml.backup src-tauri\Cargo.toml >nul
)

echo.
echo ==========================================
if %errorlevel% equ 0 (
    echo   ¡BUILD EXITOSO!
    echo ==========================================
    echo Ejecutable en: src-tauri\target\release\disk-dominator.exe
) else (
    echo   ERROR EN BUILD
    echo ==========================================
)
echo.
pause