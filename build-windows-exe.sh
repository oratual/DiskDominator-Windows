#!/bin/bash

# Script para compilar DiskDominator.exe para Windows desde WSL/Linux

echo "🚀 Iniciando compilación de DiskDominator para Windows..."

# Verificar que estamos en el directorio correcto
if [ ! -f "Cargo.toml" ]; then
    echo "❌ Error: No se encontró Cargo.toml. Ejecuta este script desde la raíz del proyecto."
    exit 1
fi

# Instalar target de Windows si no está instalado
echo "📦 Verificando target x86_64-pc-windows-gnu..."
rustup target add x86_64-pc-windows-gnu

# Instalar herramientas de compilación cruzada si no están instaladas
echo "🔧 Verificando herramientas de compilación cruzada..."
if ! command -v x86_64-w64-mingw32-gcc &> /dev/null; then
    echo "📥 Instalando mingw-w64..."
    sudo apt-get update
    sudo apt-get install -y mingw-w64
fi

# Limpiar builds anteriores
echo "🧹 Limpiando builds anteriores..."
cd src-tauri
cargo clean

# Compilar frontend primero
echo "🎨 Compilando frontend..."
cd ..
npm run build

# Volver a src-tauri
cd src-tauri

# Configurar variables de entorno para compilación cruzada
export CC_x86_64_pc_windows_gnu=x86_64-w64-mingw32-gcc
export CXX_x86_64_pc_windows_gnu=x86_64-w64-mingw32-g++
export AR_x86_64_pc_windows_gnu=x86_64-w64-mingw32-ar
export CARGO_TARGET_X86_64_PC_WINDOWS_GNU_LINKER=x86_64-w64-mingw32-gcc

# Compilar para Windows
echo "🔨 Compilando ejecutable Windows..."
cargo build --release --target x86_64-pc-windows-gnu

# Verificar si la compilación fue exitosa
if [ -f "target/x86_64-pc-windows-gnu/release/disk-dominator.exe" ]; then
    echo "✅ Compilación exitosa!"
    echo "📍 Ejecutable creado en: src-tauri/target/x86_64-pc-windows-gnu/release/disk-dominator.exe"
    
    # Copiar a directorio de salida
    mkdir -p ../dist/windows
    cp target/x86_64-pc-windows-gnu/release/disk-dominator.exe ../dist/windows/
    
    # Copiar archivos necesarios
    echo "📋 Copiando archivos adicionales..."
    cp -r ../suite-core/apps/disk-dominator/out ../dist/windows/
    
    echo "📦 Archivos listos en: dist/windows/"
    echo "🎉 ¡Compilación completada con éxito!"
else
    echo "❌ Error: No se pudo compilar el ejecutable."
    exit 1
fi