# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2025-01-14

### 🐛 Corregido
- **Crash de Tokio Runtime**: Arreglado el panic "there is no reactor running" moviendo la inicialización async al handler de setup de Tauri
- **Error window.__TAURI__ undefined**: Habilitado `withGlobalTauri: true` en tauri.conf.json para inyectar la API globalmente
- **Crash en sección de duplicados**: Reemplazados todos los `unwrap()` con manejo de errores apropiado usando `map_err()`
- **Letras de disco incorrectas**: Corregido el bug donde se mostraba el primer carácter del nombre del disco en lugar de la letra real
  - Antes: "1TB Drive (L:)" mostraba como "1:"
  - Ahora: Usa correctamente el campo `drive_letter` del struct DiskInfo

### 🔧 Cambiado
- Refactorizado AppState para usar `Arc<AppState>` para compartir estado thread-safe
- Mejorado el sistema de detección de discos en Windows con múltiples métodos de fallback (WMIC, PowerShell, fsutil)
- Añadido campo `drive_letter: Option<String>` a DiskInfo para separar la letra del disco del nombre

### 📦 Añadido
- Script `DEBUG_FIXED.bat` para debuggear la versión arreglada
- Distribución portable mejorada con todos los archivos web necesarios

## [0.1.1] - 2025-01-13

### 🚀 Añadido
- Integración completa con datos reales del sistema
- Detección automática del usuario actual de Windows
- Sistema de logs de actividad en tiempo real
- Scripts de distribución portable para Windows

### 🔧 Cambiado
- Reemplazados todos los datos dummy con información real del sistema
- Mejorado el empaquetado para Windows con scripts de instalación de dependencias

## [0.1.0] - 2025-01-12

### 🎉 Lanzamiento Inicial
- Interfaz completa con Next.js 14 y TypeScript
- Backend en Rust con Tauri
- Vista de inicio con resumen del sistema
- Análisis de discos con múltiples tipos de escaneo
- Detección de archivos duplicados
- Gestión de archivos grandes
- Organización inteligente con IA
- Modo oscuro/claro
- Características de accesibilidad