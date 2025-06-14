# DiskDominator para Windows - Versión con Datos Reales

## 🚀 Inicio Rápido

### Paso 1: Instalar Dependencias (IMPORTANTE)
1. Haz clic derecho en `INSTALAR_DEPENDENCIAS.bat`
2. Selecciona "Ejecutar como administrador"
3. Espera a que se instalen las dependencias

### Paso 2: Ejecutar DiskDominator
- **Opción A**: Doble clic en `RUN_DISKDOMINATOR.bat`
- **Opción B**: Doble clic directo en `DiskDominator.exe`

## 🐛 Solución de Problemas

Si el programa no arranca:

1. **Ejecuta el diagnóstico**:
   - Doble clic en `DEBUG_DISKDOMINATOR.bat`
   - Revisa el archivo `debug_output.txt` que se genera

2. **Diagnóstico avanzado** (PowerShell):
   - Clic derecho en `DIAGNOSTICAR.ps1`
   - Selecciona "Ejecutar con PowerShell"

3. **Errores comunes**:
   - **"No se encuentra VCRUNTIME140.dll"**: Ejecuta INSTALAR_DEPENDENCIAS.bat como administrador
   - **Ventana se cierra inmediatamente**: Falta WebView2, ejecuta INSTALAR_DEPENDENCIAS.bat
   - **Error de permisos**: Ejecuta como administrador

## 📋 Requisitos del Sistema

- Windows 10/11 (64-bit)
- Microsoft Edge WebView2 (se instala automáticamente)
- Visual C++ Redistributable (se instala automáticamente)
- 100 MB de espacio en disco
- 4 GB de RAM recomendado

## ✨ Características

Esta versión muestra **DATOS REALES** de tu sistema:
- ✅ Discos reales del sistema
- ✅ Archivos reales escaneados
- ✅ Duplicados reales detectados
- ✅ Espacio real recuperable
- ✅ Usuario real del sistema

## 📁 Archivos Incluidos

- `DiskDominator.exe` - Aplicación principal
- `RUN_DISKDOMINATOR.bat` - Launcher simple
- `INSTALAR_DEPENDENCIAS.bat` - Instalador de dependencias (ejecutar primero)
- `DEBUG_DISKDOMINATOR.bat` - Para capturar errores
- `DIAGNOSTICAR.ps1` - Diagnóstico avanzado

## ⚠️ Notas Importantes

1. La primera vez SIEMPRE ejecuta `INSTALAR_DEPENDENCIAS.bat` como administrador
2. El programa puede tardar unos segundos en arrancar la primera vez
3. Windows Defender puede escanear el archivo la primera vez (es normal)

## 🆘 Soporte

Si continúas teniendo problemas:
1. Ejecuta DEBUG_DISKDOMINATOR.bat
2. Copia el contenido de debug_output.txt
3. Reporta el problema en GitHub: https://github.com/oratual/DiskDominator