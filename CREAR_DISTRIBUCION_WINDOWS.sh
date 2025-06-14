#!/bin/bash

echo "=== Creando distribución portable de DiskDominator para Windows ==="

# Crear directorio de distribución
DIST_DIR="dist/DiskDominator-Windows-Portable"
rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"

# Copiar el ejecutable
echo "Copiando ejecutable..."
cp src-tauri/target/x86_64-pc-windows-gnu/release/disk-dominator.exe "$DIST_DIR/DiskDominator.exe"

# Crear estructura de directorios esperada por Tauri
echo "Creando estructura de archivos..."
mkdir -p "$DIST_DIR/suite-core/apps/disk-dominator"

# Copiar archivos web compilados
echo "Copiando archivos web..."
cp -r suite-core/apps/disk-dominator/out "$DIST_DIR/suite-core/apps/disk-dominator/"

# Copiar scripts de Windows
echo "Copiando scripts de ayuda..."
cp RUN_DISKDOMINATOR.bat "$DIST_DIR/"
cp DEBUG_DISKDOMINATOR.bat "$DIST_DIR/"
cp INSTALAR_DEPENDENCIAS.bat "$DIST_DIR/"
cp DIAGNOSTICAR.ps1 "$DIST_DIR/"
cp VERIFICAR_ARCHIVOS.bat "$DIST_DIR/"
cp README_WINDOWS.md "$DIST_DIR/"

# Crear un archivo .bat específico para la versión portable
cat > "$DIST_DIR/DISKDOMINATOR_PORTABLE.bat" << 'EOF'
@echo off
echo =====================================
echo DiskDominator - Version Portable
echo =====================================
echo.
echo Iniciando DiskDominator...
echo.

:: Ejecutar desde el directorio actual
cd /d "%~dp0"
start "" "DiskDominator.exe"

if errorlevel 1 (
    echo.
    echo ERROR: No se pudo ejecutar DiskDominator.exe
    echo Ejecuta INSTALAR_DEPENDENCIAS.bat si es la primera vez
    pause
)
EOF

echo ""
echo "✅ Distribución creada en: $DIST_DIR"
echo ""
echo "Contenido:"
ls -la "$DIST_DIR/"
echo ""
echo "Tamaño total:"
du -sh "$DIST_DIR"

echo ""
echo "Para usar en Windows:"
echo "1. Copia toda la carpeta $DIST_DIR a Windows"
echo "2. Ejecuta INSTALAR_DEPENDENCIAS.bat como administrador (primera vez)"
echo "3. Ejecuta DISKDOMINATOR_PORTABLE.bat"