# DiskDominator

Aplicación para ordenar discos duros con ayuda de IA

<<<<<<< HEAD
## 🚀 Para ejecutar en Windows
**IMPORTANTE**: Los archivos .hta y .bat DEBEN estar en la carpeta raíz de DiskDominator
- Usa `DiskDominator-Fixed.hta` (recomendado) 
- El archivo debe estar junto a `package.json`

=======
>>>>>>> origin/master
## Stack Tecnológico

- **Frontend**: Next.js (completado)
- **Backend**: Rust con Tauri
- **IA**: Integración con modelos de lenguaje para análisis inteligente

## Estructura del Proyecto

```
DiskDominator/
├── frontend/          # Aplicación Next.js (completada)
├── src-tauri/        # Backend Rust/Tauri
├── shared/           # Tipos y utilidades compartidas
└── docs/             # Documentación del proyecto
```

## Desarrollo con Claude Squad

Este proyecto utiliza Claude Squad para gestionar múltiples instancias de desarrollo:

1. **Frontend** - Mejoras y mantenimiento de la UI
2. **Backend** - Desarrollo del core en Rust
3. **IA Integration** - Integración con modelos de lenguaje
4. **Testing** - Pruebas automatizadas y QA

## Instalación

```bash
# Clonar el repositorio
git clone git@github.com:oratual/DiskDominator.git

# Instalar dependencias del frontend
cd frontend && npm install

# Configurar Tauri
cd ../src-tauri && cargo build
```

## Desarrollo

Ver `CLAUDE.md` para instrucciones específicas de desarrollo con Claude Code.