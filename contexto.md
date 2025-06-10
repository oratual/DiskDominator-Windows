# Contexto del Proyecto: Advanced Disk Management

Este documento proporciona una descripción general de los archivos y componentes que conforman el sistema de gestión avanzada de discos.

## Estructura General

El proyecto es una aplicación web para analizar y gestionar el espacio en disco, encontrar archivos grandes, identificar duplicados y organizar archivos. Está construido con Next.js, React y utiliza componentes de UI de shadcn/ui.

## Componentes Principales

- **disk-dominator-v2.tsx** y **disk-dominator-v2-fixed.tsx**: Componentes principales que integran todas las vistas y funcionalidades de la aplicación.
- **tab-navigation.tsx**: Sistema de navegación por pestañas para cambiar entre las diferentes vistas.
- **main-tab.tsx**: Componente que maneja la pestaña principal y su contenido.
- **disk-selector.tsx**: Permite al usuario seleccionar qué disco o unidad analizar.
- **file-explorer.tsx** y **file-explorer-with-checkboxes.tsx**: Exploradores de archivos para navegar por el sistema de archivos.
- **user-menu.tsx** y **fixed-user-menu.tsx**: Menús de usuario para acciones relacionadas con la cuenta.
- **user-profile-button.tsx**: Botón para acceder al perfil de usuario.

## Vistas

### Vista de Estado del Disco (Disk Status)
- **disk-status-view/index.tsx**: Vista principal del estado del disco.
- **disk-status-view/components/disk-card.tsx**: Tarjeta que muestra información sobre un disco.
- **disk-status-view/components/disk-status-message.tsx**: Mensajes sobre el estado del disco.
- **disk-status-view/components/ai-assistant.tsx**: Asistente de IA para ayudar con la gestión del disco.
- **disk-status-view/components/scan-types-info.tsx**: Información sobre los tipos de escaneo disponibles.
- **disk-status-view/components/exclude-modal.tsx**: Modal para excluir archivos o carpetas del análisis.
- **disk-status-view/types.ts**: Definiciones de tipos para la vista de estado del disco.
- **disk-status-view/utils.ts**: Utilidades para la vista de estado del disco.

### Vista de Archivos Grandes (Big Files)
- **big-files-view/index.tsx**: Vista principal de archivos grandes.
- **big-files-view/components/file-list-view.tsx**: Lista de archivos grandes.
- **big-files-view/components/file-explorer-view.tsx**: Explorador para archivos grandes.
- **big-files-view/components/file-size-slider.tsx**: Control deslizante para filtrar por tamaño de archivo.
- **big-files-view/components/storage-stats.tsx**: Estadísticas de almacenamiento.
- **big-files-view/components/ai-assistant.tsx**: Asistente de IA específico para archivos grandes.
- **big-files-view/components/file-sidebar.tsx**: Barra lateral con información de archivos.
- **big-files-view/types.ts**: Definiciones de tipos para la vista de archivos grandes.
- **big-files-view/utils.ts**: Utilidades para la vista de archivos grandes.

### Otras Vistas
- **duplicates-view.tsx**: Vista para identificar y gestionar archivos duplicados.
- **organize-view.tsx**: Vista para organizar archivos.
- **home-view.tsx**: Vista principal o de inicio.

## Componentes de UI y Utilidades

- **readability-provider.tsx**: Proveedor para mejorar la legibilidad de la interfaz.
- **theme-provider.tsx**: Proveedor para gestionar el tema de la aplicación.
- **color-filters.tsx**, **color-filter-test.tsx**, **color-filter-manager.tsx**: Componentes para filtros de color y accesibilidad.
- **contrast-test.tsx**, **contrast-manager.tsx**: Componentes para pruebas y gestión de contraste.
- **components/ui/**: Componentes de UI reutilizables (separador, menú desplegable, avatar, progreso).

## Configuración y Archivos del Sistema

- **app/layout.tsx**: Diseño principal de la aplicación.
- **app/page.tsx**: Página principal de la aplicación.
- **app/globals.css**: Estilos globales.
- **tailwind.config.ts**: Configuración de Tailwind CSS.
- **next.config.mjs**: Configuración de Next.js.
- **hooks/use-mobile.ts**: Hook para detectar dispositivos móviles.
- **convex/_generated/api.tsx**: API generada para Convex (base de datos).

## Archivos Estáticos

- **public/vibrant-street-market.png**: Imagen de un mercado callejero vibrante.
- **public/soccer-player-portrait.png**: Imagen de retrato de un jugador de fútbol.
- **BlueLineBug.txt**: Archivo de texto que documenta un error relacionado con líneas azules.

## Flujo de Trabajo Típico

1. El usuario inicia la aplicación y ve la vista principal (home-view).
2. Selecciona un disco para analizar usando disk-selector.
3. Navega entre diferentes vistas (estado del disco, archivos grandes, duplicados, organizar) usando tab-navigation.
4. En cada vista, puede realizar acciones específicas como:
   - Ver estadísticas del disco
   - Identificar archivos grandes que ocupan espacio
   - Encontrar y gestionar duplicados
   - Organizar archivos
5. Puede recibir asistencia de IA para optimizar el espacio en disco.
