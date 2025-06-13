# 🪟 Guía de Instalación para Windows

## 📋 Requisitos Previos

1. **Git** - Para clonar el repositorio
   - Descarga: https://git-scm.com/download/win

2. **Node.js** (v18 o superior)
   - Descarga: https://nodejs.org/

3. **Rust** 
   - Descarga: https://www.rust-lang.org/tools/install
   - Ejecuta: `rustup-init.exe`

4. **Visual Studio Build Tools** (para compilar)
   - Descarga: https://visualstudio.microsoft.com/visual-cpp-build-tools/
   - Instala "Desktop development with C++"

## 🚀 Pasos de Instalación

### 1. Clonar el Repositorio

Abre PowerShell o Command Prompt:

```powershell
git clone https://github.com/oratual/DiskDominator-Windows.git
cd DiskDominator-Windows
```

### 2. Instalar Dependencias

```powershell
# Instalar dependencias de Node.js
npm install

# Instalar Tauri CLI v1.6.5 (importante: versión específica)
cargo install tauri-cli@1.6.5
```

### 3. Compilar para Windows

```powershell
# Compilar la aplicación
cargo tauri build

# O para desarrollo/pruebas
cargo tauri dev
```

### 4. Ubicación del Ejecutable

Después de compilar, encontrarás:
- **Ejecutable**: `src-tauri\target\release\disk-dominator.exe`
- **Instalador MSI**: `src-tauri\target\release\bundle\msi\`
- **Instalador NSIS**: `src-tauri\target\release\bundle\nsis\`

## 🎯 Instalación Rápida (Opción Alternativa)

Si no quieres compilar, puedes:

1. **Descargar el Release**
   - Ve a: https://github.com/oratual/DiskDominator-Windows/releases
   - Descarga `DiskDominator-Setup.exe` o `disk-dominator.exe`

2. **Ejecutar**
   - Doble click en el instalador
   - O ejecuta directamente `disk-dominator.exe`

## ⚙️ Solución de Problemas

### Error: "cargo not found"
```powershell
# Reinicia la terminal después de instalar Rust
# O añade manualmente al PATH:
$env:Path += ";$env:USERPROFILE\.cargo\bin"
```

### Error: "missing Visual C++ tools"
- Instala Visual Studio Build Tools con C++
- Reinicia el PC

### Error: "cannot find -lwebkit2gtk-4.0"
- Normal en Windows, se usará webview2 automáticamente

## 🏃 Ejecutar la Aplicación

### Modo Desarrollo (con hot reload):
```powershell
cargo tauri dev
```

### Ejecutar el .exe compilado:
```powershell
.\src-tauri\target\release\disk-dominator.exe
```

## ✨ Características en Windows

- ✅ Escaneo de todos los discos NTFS/FAT32/exFAT
- ✅ Detección rápida usando Windows API
- ✅ Interfaz nativa de Windows
- ✅ Integración con Windows Explorer
- ✅ Soporte para rutas UNC y discos de red

## 📝 Notas Importantes

1. **Permisos de Administrador**: Para escanear ciertos directorios del sistema, ejecuta como Administrador

2. **Windows Defender**: Puede que necesites añadir una excepción si detecta el exe como desconocido

3. **Primera Ejecución**: El primer escaneo puede tardar más mientras indexa

## 🆘 Ayuda Adicional

Si tienes problemas:
1. Abre un issue en GitHub
2. Incluye el error completo
3. Menciona tu versión de Windows

¡Disfruta usando DiskDominator en Windows! 🎉