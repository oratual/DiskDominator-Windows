# 🚨 IMPORTANTE: DiskDominator - Instrucciones para Usuario Windows

## Estado Actual

**⚠️ La aplicación NO está compilada como ejecutable de Windows**

Los archivos `.exe` que ves en las carpetas son placeholders vacíos. Para usar DiskDominator tienes estas opciones:

## Opción 1: Usar la versión Web (Más Fácil)

1. Abre PowerShell o CMD
2. Navega a la carpeta DiskDominator:
   ```
   cd C:\ruta\donde\copiaste\DiskDominator
   ```
3. Instala dependencias (solo primera vez):
   ```
   npm install
   ```
4. Inicia el servidor:
   ```
   npm run dev
   ```
5. Abre tu navegador en: `http://localhost:3000`

**Nota**: Funcionará como página web, NO como aplicación de escritorio nativa.

## Opción 2: Compilar la Aplicación de Escritorio (Requiere Herramientas)

### Requisitos:
- ✅ Node.js (ya lo tienes si llegaste hasta aquí)
- ❌ Rust - Instalar desde: https://rustup.rs/
- ❌ Visual Studio Build Tools - Descargar desde: https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022
- ❌ WebView2 (viene con Windows 11, en Windows 10 instalar desde Microsoft)

### Pasos para compilar:
1. Instala todos los requisitos arriba
2. Reinicia tu PC
3. Abre PowerShell como Administrador
4. Navega a DiskDominator:
   ```
   cd C:\ruta\a\DiskDominator
   ```
5. Compila la aplicación:
   ```
   npm run tauri build
   ```
6. Espera ~10-15 minutos
7. El ejecutable real estará en:
   ```
   src-tauri\target\release\DiskDominator.exe
   ```

## Opción 3: Solicitar un Release Precompilado

Contacta al desarrollador para obtener un ejecutable ya compilado, ya que compilar requiere ~3GB de herramientas de desarrollo.

## ¿Por qué está así?

DiskDominator es un proyecto en desarrollo. El código fuente está completo pero necesita ser compilado para cada sistema operativo. Lo que tienes es el código fuente, no la aplicación final.

## Resumen Rápido

- **Para usarlo YA**: Usa Opción 1 (versión web)
- **Para aplicación real**: Necesitas compilar (Opción 2) o pedir release
- **Los .exe actuales**: Son falsos, no funcionarán

---

*Última actualización: Junio 2025*