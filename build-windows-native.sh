#!/bin/bash

# Script alternativo para compilar usando cargo-tauri directamente para Windows

echo "🎯 Compilación nativa de DiskDominator.exe para Windows"
echo "=================================================="

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: Ejecuta este script desde la raíz del proyecto DiskDominator"
    exit 1
fi

# Paso 1: Compilar el frontend
echo "📦 Paso 1: Compilando frontend Next.js..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Error al compilar el frontend"
    exit 1
fi

# Paso 2: Usar Tauri para compilar específicamente para Windows
echo "🔨 Paso 2: Compilando con Tauri para Windows..."

# Opciones de compilación
echo "Selecciona el método de compilación:"
echo "1) Compilación cruzada con --target x86_64-pc-windows-gnu (recomendado)"
echo "2) Compilación con --target x86_64-pc-windows-msvc (requiere MSVC)"
echo "3) Compilación estándar (usa el target por defecto)"
read -p "Opción (1-3): " option

cd src-tauri

case $option in
    1)
        echo "🚀 Compilando con target GNU..."
        # Instalar target si no existe
        rustup target add x86_64-pc-windows-gnu
        
        # Compilar
        cargo tauri build --target x86_64-pc-windows-gnu
        
        # Rutas de salida
        EXE_PATH="target/x86_64-pc-windows-gnu/release/disk-dominator.exe"
        BUNDLE_PATH="target/x86_64-pc-windows-gnu/release/bundle"
        ;;
    2)
        echo "🚀 Compilando con target MSVC..."
        # Instalar target si no existe
        rustup target add x86_64-pc-windows-msvc
        
        # Compilar
        cargo tauri build --target x86_64-pc-windows-msvc
        
        # Rutas de salida
        EXE_PATH="target/x86_64-pc-windows-msvc/release/disk-dominator.exe"
        BUNDLE_PATH="target/x86_64-pc-windows-msvc/release/bundle"
        ;;
    3)
        echo "🚀 Compilando con target por defecto..."
        cargo tauri build
        
        # Rutas de salida
        EXE_PATH="target/release/disk-dominator.exe"
        BUNDLE_PATH="target/release/bundle"
        ;;
    *)
        echo "❌ Opción inválida"
        exit 1
        ;;
esac

# Verificar resultados
echo ""
echo "📊 Verificando resultados de compilación..."

if [ -f "$EXE_PATH" ]; then
    echo "✅ Ejecutable creado: $EXE_PATH"
    echo "   Tamaño: $(du -h $EXE_PATH | cut -f1)"
else
    echo "⚠️  No se encontró el ejecutable .exe"
fi

if [ -d "$BUNDLE_PATH/msi" ]; then
    echo "✅ Instalador MSI creado en: $BUNDLE_PATH/msi/"
    ls -la "$BUNDLE_PATH/msi/"*.msi 2>/dev/null
fi

if [ -d "$BUNDLE_PATH/nsis" ]; then
    echo "✅ Instalador NSIS creado en: $BUNDLE_PATH/nsis/"
    ls -la "$BUNDLE_PATH/nsis/"*.exe 2>/dev/null
fi

# Crear directorio de distribución
cd ..
mkdir -p dist/windows

# Copiar archivos si existen
if [ -f "src-tauri/$EXE_PATH" ]; then
    cp "src-tauri/$EXE_PATH" dist/windows/
    echo "📦 Ejecutable copiado a: dist/windows/disk-dominator.exe"
fi

echo ""
echo "🎉 ¡Proceso completado!"
echo ""
echo "📝 Notas importantes:"
echo "- Si la compilación falla, puede ser necesario instalar:"
echo "  - mingw-w64 (sudo apt-get install mingw-w64)"
echo "  - wine y wine64 para pruebas"
echo "- Para una compilación 100% nativa, ejecuta este script desde Windows"