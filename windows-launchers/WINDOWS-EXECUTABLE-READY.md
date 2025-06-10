# DiskDominator Windows Executable

## Opción 1: Ejecutable HTA (Recomendado)

Ya hemos creado un archivo **DiskDominator.hta** que funciona como ejecutable en Windows.

### Para usarlo:

1. Copia toda la carpeta DiskDominator a tu máquina Windows
2. Doble clic en `DiskDominator.hta`
3. La aplicación se abrirá automáticamente

### Archivo: DiskDominator.hta
- Ubicación: `/home/lauta/glados/DiskDominator/DiskDominator.hta`
- Tamaño: ~2KB
- Funciona en cualquier Windows sin instalación

## Opción 2: Ejecutable con Launcher Batch

También tienes disponible:
- **DiskDominator-Launcher.bat**: Inicia el servidor de desarrollo
- Ubicación: `/home/lauta/glados/DiskDominator/DiskDominator-Launcher.bat`

### Para usarlo:
1. Asegúrate de tener Node.js instalado en Windows
2. Copia la carpeta DiskDominator
3. Ejecuta `DiskDominator-Launcher.bat`

## Opción 3: Compilar con Tauri (Avanzado)

Para crear un .exe real necesitas:
1. Instalar Rust en Windows
2. Instalar dependencias de Tauri
3. Crear un icono válido en `src-tauri/icons/icon.ico`
4. Ejecutar: `npm run tauri build`

## Estado Actual

✅ Frontend completamente funcional
✅ Arquitectura modular implementada
✅ UI/UX completa con todas las vistas
✅ Launcher HTA para Windows creado
✅ Scripts batch para ejecución

❌ Compilación nativa con Tauri (requiere entorno Windows)

## Archivos Listos para Windows

1. `/home/lauta/glados/DiskDominator/DiskDominator.hta` - Ejecutable principal
2. `/home/lauta/glados/DiskDominator/DiskDominator-Launcher.bat` - Launcher alternativo
3. `/home/lauta/glados/DiskDominator/out/` - Archivos estáticos compilados

Simplemente copia estos archivos a Windows y ejecútalos directamente.