# DiskDominator - Instrucciones de Ejecución en Windows

## 🚀 Inicio Rápido

### Opción 1: Usar el Launcher HTA (Recomendado)
1. Copia toda la carpeta `DiskDominator` a tu PC Windows
2. Doble clic en **`DiskDominator-Fixed.hta`** 
3. El programa se abrirá automáticamente

**Archivo principal**: `DiskDominator-Fixed.hta`
- ✅ Detecta automáticamente rutas WSL
- ✅ Instala dependencias si es necesario
- ✅ Muestra progreso detallado
- ✅ Maneja errores correctamente

### Opción 2: Usar el Launcher Batch
1. Asegúrate de tener Node.js instalado
2. Ejecuta **`DiskDominator-Launcher.bat`**

## 📋 Requisitos

- **Node.js** v18 o superior (descarga desde [nodejs.org](https://nodejs.org))
- **Windows 10/11**
- **Navegador moderno** (Chrome, Edge, Firefox)

## 🗂️ Archivos Disponibles

| Archivo | Descripción | Uso |
|---------|-------------|-----|
| `DiskDominator-Fixed.hta` | Launcher principal con UI | **Recomendado** |
| `DiskDominator.hta` | Launcher alternativo | Backup |
| `DiskDominator-Launcher.bat` | Script batch simple | Para usuarios avanzados |
| `out/` | Archivos estáticos compilados | Ya incluidos |

## 🔧 Solución de Problemas

### Error: "Node.js is not installed"
- Descarga e instala Node.js desde https://nodejs.org
- Reinicia el launcher después de instalar

### Error: "DiskDominator files not found"
- Asegúrate de ejecutar el .hta desde dentro de la carpeta DiskDominator
- La carpeta debe contener `package.json`

### El servidor no inicia
1. Abre una terminal en la carpeta DiskDominator
2. Ejecuta: `npm install`
3. Luego: `npm run dev`
4. Abre http://localhost:3002 en tu navegador

## 📁 Estructura Requerida

```
DiskDominator/
├── DiskDominator-Fixed.hta    ← Ejecutar este
├── package.json
├── node_modules/              ← Se crea automáticamente
├── out/                       ← Archivos compilados
└── ...otros archivos
```

## ✨ Características

- 🎨 Interfaz moderna con dark/light mode
- 🤖 Asistente AI integrado
- 📊 Análisis de disco en tiempo real
- 🔍 Detección de duplicados
- 📁 Organización inteligente de archivos

## 🆘 Soporte

Si tienes problemas:
1. Verifica que Node.js esté instalado: `node --version`
2. Reinstala dependencias: `npm install`
3. Revisa la consola del navegador (F12) para errores