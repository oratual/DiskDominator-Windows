# DiskDominator

🗂️ **Aplicación inteligente para organizar discos duros con ayuda de IA**

![Version](https://img.shields.io/badge/version-0.2.0-blue)
![Platform](https://img.shields.io/badge/platform-Windows-blue)
![License](https://img.shields.io/badge/license-Proprietary-red)

## 🚀 Instalación Rápida (Windows)

### Opción 1: Ejecutable Portable (Recomendado)
1. Descarga desde `K:\_Glados\DiskDominator\dist\DiskDominator-Windows-Portable\`
2. Ejecuta `DiskDominator-Fixed.exe`
3. ¡Listo! No requiere instalación

### Opción 2: Desarrollo Local
```bash
# Requisitos: Node.js 20+, Rust 1.75+, WebView2
git clone https://github.com/oratual/DiskDominator-Windows.git
cd DiskDominator
npm install
npm run tauri dev
```

## ✨ Características Principales

### 🔍 Análisis de Discos
- Escaneo rápido y profundo de unidades
- Detección automática de todos los discos
- Visualización en tiempo real del espacio utilizado
- Soporte para discos locales y externos

### 🔄 Detección de Duplicados
- Búsqueda inteligente por hash, nombre o tamaño
- Agrupación automática de archivos duplicados
- Operaciones batch para limpieza rápida
- Vista previa de archivos antes de eliminar

### 📊 Gestión de Archivos Grandes
- Filtros avanzados por tamaño, tipo y fecha
- Análisis de distribución de espacio
- Estimación de potencial de compresión
- Estadísticas detalladas por tipo de archivo

### 🤖 Organización con IA
- Sugerencias inteligentes de organización
- Categorización automática de archivos
- Reglas personalizables
- Modo preview antes de aplicar cambios

## 🛠️ Stack Tecnológico

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Rust, Tauri 1.8
- **UI Components**: shadcn/ui, Radix UI
- **Base de Datos**: SQLite (embebida)
- **IA**: Preparado para Claude/OpenAI

## 📋 Estado del Proyecto

### ✅ Completado
- Interfaz de usuario completa
- Detección y análisis de discos
- Búsqueda de duplicados funcional
- Gestión de archivos grandes
- Sistema de logging profesional
- Distribución portable para Windows

### 🚧 En Desarrollo
- Integración con IA (Claude/OpenAI)
- Operaciones de archivo avanzadas
- Sistema de actualizaciones automáticas
- Soporte multi-idioma

### 🔜 Próximamente
- Versión para macOS
- Sincronización en la nube
- Plugins y extensiones
- API para automatización

## 🏗️ Arquitectura

```
DiskDominator/
├── app/                    # Frontend Next.js
│   ├── components/        # Componentes React
│   ├── hooks/            # Custom React hooks
│   └── lib/              # Utilidades
├── src-tauri/            # Backend Rust
│   ├── src/
│   │   ├── commands/     # Comandos Tauri
│   │   ├── file_system/  # Operaciones de archivos
│   │   └── disk_analyzer/# Lógica de análisis
│   └── Cargo.toml
├── public/               # Assets estáticos
└── dist/                 # Builds de distribución
```

## 🧪 Testing

```bash
# Tests del backend
cd src-tauri && cargo test

# Tests del frontend (pendiente)
npm test

# Linting
npm run lint
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crea tu feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la branch (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Software propietario. Todos los derechos reservados.

## 🐛 Reporte de Bugs

Si encuentras un bug:
1. Verifica los logs en `%LOCALAPPDATA%\DiskDominator\logs\`
2. Abre un issue en GitHub con:
   - Descripción del problema
   - Pasos para reproducir
   - Logs relevantes
   - Sistema operativo y versión

## 📞 Contacto

- **GitHub**: [@oratual](https://github.com/oratual)
- **Proyecto**: [DiskDominator-Windows](https://github.com/oratual/DiskDominator-Windows)

---

**Nota**: Este es un proyecto en desarrollo activo. Algunas características pueden estar incompletas o cambiar en futuras versiones.