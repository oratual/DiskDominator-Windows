# Guía del Usuario: Analizador de Discos - DiskDominator

## 🎯 ¿Qué hace el Analizador?

El Analizador de Discos es la sección principal de DiskDominator que examina tus discos duros para ayudarte a:
- **Encontrar archivos duplicados** que ocupan espacio innecesario
- **Identificar archivos gigantes** que consumen mucho almacenamiento
- **Organizar tu disco** de manera eficiente
- **Liberar espacio** eliminando archivos redundantes

## 🖥️ Elementos de la Interfaz

### 1. Panel Principal de Discos
Muestra todas las unidades de almacenamiento detectadas en tu sistema como tarjetas individuales con:
- **Nombre del disco** (ej: "Disco Local (C:)", "Datos (D:)")
- **Estado actual** del escaneo con indicadores visuales de color
- **Barras de progreso duales** para el sistema de doble escaneo
- **Información de almacenamiento** (espacio usado, libre y total)
- **Botones de acción** según el estado

### 2. Sistema de Doble Escaneo

DiskDominator utiliza un innovador sistema de **dos tipos de escaneo**:

#### 🟢 Escaneo Rápido (Quick Scan)
- **Icono**: Rayo (⚡)
- **Color**: Verde
- **Duración**: Pocos minutos
- **Función**: Recopila metadata básica de archivos (nombres, tamaños, fechas)
- **Habilita**: Pestañas de "Duplicados" y "Archivos Gigantes"
- **Progreso**: Barra verde superior en cada tarjeta de disco

#### 🟣 Escaneo Profundo (Deep Scan)
- **Icono**: Disco duro (💾)
- **Color**: Púrpura
- **Duración**: Puede tardar horas dependiendo del tamaño del disco
- **Función**: Análisis exhaustivo del contenido y estructura de archivos
- **Habilita**: Pestaña "Ordenar Disco"
- **Progreso**: Barra púrpura inferior en cada tarjeta de disco
- **Inicio automático**: Comienza automáticamente después del escaneo rápido

### 3. Indicadores de Estado

Cada disco muestra su estado actual con colores y textos específicos:

- **🔵 Pendiente** (gris): El disco está esperando para ser escaneado
- **🟢 Escaneando** (verde/púrpura): Análisis en progreso
- **🟡 Pausado** (naranja): El escaneo está temporalmente detenido
- **✅ Completado** (verde): Todos los escaneos finalizados exitosamente
- **❌ Error** (rojo): Hubo un problema durante el escaneo

### 4. Panel de Mensajes de Estado

En la parte superior aparece un panel informativo que:
- Te indica qué funciones están disponibles según el progreso
- Muestra animaciones temáticas durante el escaneo
- Cambia de color según la fase actual
- Proporciona consejos sobre qué hacer mientras esperas

## 📊 Datos Mostrados Durante el Escaneo

### Durante el Escaneo Activo:
1. **Porcentaje de progreso** para cada tipo de escaneo
2. **Tiempo estimado restante** con contador regresivo
3. **Ruta actual** que se está analizando
4. **Número de archivos procesados** vs. total estimado
5. **Indicadores de disponibilidad** de funciones (✓ Duplicados, ✓ Organizar)
6. **Cantidad de errores** encontrados (si los hay)

### Después del Escaneo:
1. **Estadísticas completas** del disco
2. **Acceso completo** a todas las pestañas habilitadas
3. **Botón "Volver a escanear"** para actualizar los datos

## 🎮 Acciones Disponibles

### Para Discos No Escaneados:
- **Botón "Escanear"**: Inicia el proceso de análisis completo (ambos escaneos)
- **Quick Scan**: Ejecuta solo el escaneo rápido
- **Deep Scan**: Ejecuta análisis profundo completo

### Durante el Escaneo:
- **⏸️ Pausar**: Detiene temporalmente el análisis sin perder progreso
- **▶️ Reanudar**: Continúa desde donde se pausó
- **❌ Cancelar**: Detiene completamente y descarta el progreso

### Después del Escaneo:
- **Volver a escanear**: Actualiza los datos con un nuevo análisis
- **Acceso a pestañas**: Duplicados, Archivos Gigantes, Ordenar Disco

## 🔧 Configuración de Exclusiones

### Panel "Omitir del escaneo":
Permite configurar qué carpetas o tipos de archivos NO quieres analizar:

1. **Campo de patrones de exclusión**: 
   - Ingresa patrones separados por comas
   - Ejemplos: `node_modules, .git, *.tmp, *.log`
   - Soporta wildcards (* para cualquier texto)

2. **Botón "Configurar"**:
   - Abre un explorador de archivos visual
   - Permite seleccionar carpetas específicas con checkboxes
   - Muestra vista previa de lo que será excluido

### ¿Por qué excluir archivos?
- **Privacidad**: Omitir carpetas personales o sensibles
- **Rendimiento**: Saltar carpetas del sistema o temporales
- **Relevancia**: Ignorar backups o archivos de desarrollo

## 📋 Flujo de Trabajo Típico

### 1. **Inicio del Análisis**
   - Abre DiskDominator
   - Revisa los discos detectados
   - Configura exclusiones si es necesario
   - Haz clic en "Escanear" en los discos deseados

### 2. **Durante el Escaneo Rápido** (2-10 minutos)
   - Observa la barra verde de progreso
   - Espera a que alcance ~40% para acceder a "Duplicados"
   - Al 100% se habilitan "Duplicados" y "Archivos Gigantes"
   - El escaneo profundo inicia automáticamente

### 3. **Durante el Escaneo Profundo** (30 min - varias horas)
   - Puedes usar las funciones ya habilitadas
   - Revisa duplicados mientras continúa el análisis
   - Al ~80% se habilita parcialmente "Ordenar Disco"
   - Al 100% todas las funciones están disponibles

### 4. **Análisis de Resultados**
   - **Pestaña Duplicados**: Encuentra y elimina archivos repetidos
   - **Archivos Gigantes**: Identifica los mayores consumidores de espacio
   - **Ordenar Disco**: Organiza archivos por tipo y estructura

### 5. **Acciones de Limpieza**
   - Selecciona archivos para eliminar
   - Revisa antes de confirmar
   - Ejecuta la limpieza
   - Opcionalmente, vuelve a escanear para ver el espacio liberado

## 💡 Consejos y Mejores Prácticas

### Optimización del Escaneo:
1. **Cierra aplicaciones pesadas** antes de escanear para mejor rendimiento
2. **Excluye carpetas del sistema** que no necesitas analizar
3. **Escanea un disco a la vez** si tu PC tiene recursos limitados
4. **Usa el escaneo rápido primero** para resultados inmediatos

### Gestión del Espacio:
1. **Empieza por archivos gigantes** - mayor impacto con menos esfuerzo
2. **Revisa duplicados en carpetas de descargas** primero
3. **Ten cuidado con archivos del sistema** - verifica antes de eliminar
4. **Crea backups** de archivos importantes antes de limpiar

### Pausar vs Cancelar:
- **Pausa** si necesitas usar la PC para otra tarea pesada temporalmente
- **Cancela** solo si necesitas cambiar configuración de exclusiones
- Los escaneos pausados **mantienen el progreso** y pueden reanudarse

## 🔐 Privacidad y Seguridad

### ¿Qué información se analiza?
- **Metadata únicamente**: nombres, tamaños, fechas, ubicaciones
- **NO se lee el contenido** de los archivos
- **Sin acceso a datos personales** dentro de documentos
- **Análisis local**: todo ocurre en tu PC, sin envío a servidores

### Control del Usuario:
- **Exclusiones personalizables** para máxima privacidad
- **Confirmación requerida** antes de eliminar cualquier archivo
- **Vista previa disponible** de lo que se va a eliminar
- **Sin eliminaciones automáticas** - siempre bajo tu control

## 🎨 Asistente AI Integrado

El panel lateral izquierdo contiene un asistente que puede:
- Explicar qué hace cada tipo de escaneo
- Ayudarte a interpretar los resultados
- Sugerir qué archivos son seguros para eliminar
- Responder dudas sobre el proceso

Para usarlo:
1. Escribe tu pregunta en el campo inferior
2. Presiona Enter o el botón de enviar
3. El asistente responderá contextualmente
4. Puedes colapsar el panel con el botón de flecha

## ⚡ Resolución de Problemas Comunes

### "El escaneo va muy lento"
- Verifica que no haya otras aplicaciones usando intensivamente el disco
- Considera pausar y reanudar después de cerrar programas pesados
- Excluye carpetas muy grandes que no necesitas analizar

### "No puedo acceder a algunas pestañas"
- Cada pestaña requiere cierto nivel de escaneo completado
- Espera a que las barras de progreso correspondientes lleguen al 100%
- Verifica los indicadores de check (✓) en la tarjeta del disco

### "El escaneo se detuvo con error"
- Intenta excluir la carpeta problemática
- Ejecuta DiskDominator como administrador
- Verifica que el disco no tenga errores con herramientas del sistema

---

💡 **Tip Final**: La paciencia es clave. Mientras más grande el disco, más tiempo tomará el análisis completo, pero los resultados valen la pena para mantener tu almacenamiento optimizado.