# 🏠 Guía de Usuario - Panel de Control (Inicio)

## ¿Qué es el Panel de Control?

El Panel de Control es la pantalla principal de DiskDominator, tu centro de comando para gestionar el almacenamiento de tu computadora. Desde aquí puedes:
- Ver el estado actual de todos tus discos
- Iniciar análisis completos del sistema
- Acceder rápidamente a las herramientas principales
- Monitorear la actividad reciente

## 🎯 Elementos de la Interfaz

### 1. Banner de Bienvenida
- **Ubicación**: Parte superior de la pantalla
- **Color**: Azul claro
- **Función**: Te da la bienvenida y explica brevemente qué puede hacer DiskDominator
- **Icono**: ℹ️ (información)

### 2. Acciones Rápidas (4 botones principales)

#### 🔄 Analizar Discos
- **Color**: Rosa/Magenta
- **Función**: Inicia un escaneo completo de tus discos duros
- **Descripción**: "Realiza dos escaneos completos de tus unidades. El primero, más rápido, dura unos minutos"
- **Al hacer clic**: Te lleva a la vista de análisis donde puedes ver el progreso

#### 📑 Encontrar Duplicados
- **Color**: Turquesa
- **Función**: Busca archivos repetidos en tu sistema
- **Descripción**: "Identifica archivos duplicados para liberar espacio"
- **Requisito**: Necesitas hacer un análisis previo
- **Estado**: Si está deshabilitado, muestra "Requiere escaneo previo" en naranja

#### 💾 Archivos Gigantes
- **Color**: Verde
- **Función**: Encuentra los archivos más grandes de tu sistema
- **Descripción**: "Localiza los archivos más grandes. Encuentra qué está ocupando más espacio"
- **Requisito**: Necesitas hacer un análisis previo

#### 📁 Organizar Disco
- **Color**: Púrpura
- **Función**: Reorganiza automáticamente tus archivos
- **Descripción**: "Reorganiza automáticamente tus archivos por tipo, fecha o tamaño"
- **Requisito**: Necesitas hacer un análisis previo

### 3. Estado de los Discos

**Ubicación**: Panel grande a la izquierda

#### Información que muestra:
- **Lista de discos**: Cada disco con su letra (C:, D:, etc.)
- **Barra de progreso**: Visual del espacio usado
- **Porcentaje**: Número exacto de uso
- **Detalles**: Espacio usado, total y libre

#### Código de colores de las barras:
- 🟢 **Verde**: Menos del 50% usado (todo bien)
- 🔵 **Azul**: Entre 50-75% usado (normal)
- 🟠 **Naranja**: Entre 75-90% usado (atención)
- 🔴 **Rojo**: Más del 90% usado (crítico)

#### Información adicional:
- **Total del sistema**: Suma de todos los discos
- **Espacio usado total**: Cuánto estás usando en total
- **Espacio libre total**: Cuánto te queda disponible

### 4. Actividad Reciente

**Ubicación**: Panel a la derecha

#### Muestra:
- **Icono**: Indica el tipo de actividad (🔄 escaneo, 📑 duplicados, 📁 organización)
- **Acción**: Qué se hizo ("Búsqueda de archivos grandes iniciada")
- **Objetivo**: Dónde se hizo ("Filtro: min_size=1GB")
- **Tiempo**: Cuándo ocurrió ("Hace 5 minutos")

#### Tipos de actividades:
- Escaneos iniciados/completados
- Duplicados encontrados
- Archivos eliminados o movidos
- Discos organizados
- Errores ocurridos

## 🚀 Flujo de Trabajo Típico

### Para usuarios nuevos:
1. **Lee el banner de bienvenida** para entender qué hace la aplicación
2. **Revisa el estado de tus discos** para ver cuáles necesitan atención
3. **Haz clic en "Analizar Discos"** para hacer tu primer escaneo
4. **Espera** a que termine el análisis (verás el progreso en la siguiente pantalla)
5. **Regresa al inicio** y ahora todas las opciones estarán habilitadas
6. **Elige** qué problema resolver primero: duplicados, archivos grandes u organización

### Para usuarios frecuentes:
1. **Revisa la actividad reciente** para ver qué se hizo la última vez
2. **Verifica el estado de los discos** para detectar cambios
3. **Usa las acciones rápidas** para ir directo a la herramienta que necesitas

## 💡 Consejos de Uso

1. **Colores de alerta**: Si ves barras rojas o naranjas, es momento de liberar espacio
2. **Escaneo regular**: Realiza un análisis completo al menos una vez al mes
3. **Actividad reciente**: Úsala para verificar que las operaciones se completaron correctamente
4. **Botón deshabilitado**: Si una acción está en gris, primero necesitas hacer un análisis

## 🎮 Accesos Directos

- **Clic en cualquier disco**: Te muestra más detalles de ese disco específico
- **Botón "Ver detalles completos"**: Te lleva a la vista detallada de análisis
- **Clic en una actividad**: Te da más información sobre esa operación

## ⚙️ Características Automáticas

- **Actualización automática**: Los datos se refrescan cada 30 segundos
- **Detección de cambios**: Si conectas o desconectas un disco, aparecerá automáticamente
- **Historial persistente**: La actividad reciente se guarda entre sesiones

## ❓ Solución de Problemas Comunes

**P: ¿Por qué algunos botones están deshabilitados?**
R: Necesitas hacer un análisis primero. Haz clic en "Analizar Discos".

**P: ¿Por qué no veo todos mis discos?**
R: Solo se muestran discos con sistema de archivos reconocido (no CD/DVD vacíos).

**P: ¿Qué significa "Ejecutando..." en un botón?**
R: La acción se está procesando. Espera unos segundos.

**P: ¿Por qué mi disco está en rojo?**
R: Tienes menos del 10% de espacio libre. Es urgente liberar espacio.