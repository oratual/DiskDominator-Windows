# 🔍 Guía de Usuario - Analizador de Discos

## ¿Qué es el Analizador de Discos?

El Analizador es el motor principal de DiskDominator. Su función es examinar todos tus archivos para:
- Crear un mapa completo de tu almacenamiento
- Identificar archivos duplicados mediante huellas digitales
- Encontrar archivos grandes que ocupan mucho espacio
- Preparar la información necesaria para organizar tu disco

## 🎯 Sistema de Doble Escaneo

DiskDominator usa un sistema innovador de **dos fases de escaneo secuenciales**:

### 🚀 Quick Scan (Escaneo Rápido) - Fase 1 con Tecnología MFT
- **Duración**: 2-5 minutos (hasta 30x más rápido que escaneo tradicional)
- **Tecnología Avanzada**: Acceso directo a la **Master File Table (MFT)** de NTFS
  - **DeviceIoControl** con comando `FSCTL_GET_NTFS_FILE_RECORD`
  - **USN Journal** (Change Journal) para actualizaciones en tiempo real
  - **Índice en memoria** basado en la estructura MFT nativa
  - **Sin escaneo recursivo**: Evita la navegación tradicional archivo por archivo
- **Analiza directamente desde MFT**: 
  - Nombres, tamaños, fechas (creación, modificación, acceso)
  - Atributos de archivo y permisos NTFS
  - Referencias de archivo (FileRef) para tracking rápido
  - Hash parcial para archivos >1MB (primeros y últimos bloques)
- **Beneficio**: Desbloquea **inmediatamente** funciones de Duplicados y Archivos Grandes
- **Progreso**: Actualizaciones cada 100 registros MFT vía WebSocket
- **Requisitos Técnicos**: Permisos administrativos, unidades NTFS únicamente

### 🔬 Deep Scan (Escaneo Profundo) - Fase 2
- **Duración**: 10-60 minutos (según tamaño del disco)
- **Tecnología**: Análisis SHA-256 completo + detección avanzada
- **Analiza**: 
  - Contenido completo con hash SHA-256 para precisión total
  - Detección de duplicados por contenido idéntico
  - Análisis de estructura para organización inteligente
- **Beneficio**: Habilita la función **Organizar Disco** con máxima precisión
- **Seguridad**: Verifica integridad de archivos durante el proceso

## 🖥️ Elementos de la Interfaz

### 1. Panel de Selección de Discos

Muestra tarjetas para cada disco con:
- **Letra del disco** (C:, D:, etc.)
- **Nombre descriptivo** 
- **Barra de uso** con código de colores:
  - 🟢 Verde: < 60% usado
  - 🟡 Amarillo: 60-80% usado  
  - 🔴 Rojo: > 80% usado
- **Espacio usado/total** (ej: "450 GB / 1 TB")
- **Sistema de archivos** (NTFS, FAT32, etc.)

### 2. Estados del Disco

Cada disco puede estar en uno de estos estados:

#### ⏸️ No escaneado
- **Botón azul**: "Escanear Disco"
- **Acción**: Inicia el análisis

#### 🔄 Escaneando
- **Dos barras de progreso**:
  - Superior: Quick Scan (azul claro)
  - Inferior: Deep Scan (azul oscuro)
- **Información mostrada**:
  - Porcentaje completado
  - Tiempo estimado restante
  - Ruta actual analizándose
  - Archivos procesados
- **Botones disponibles**:
  - ⏸️ Pausar (amarillo)
  - ❌ Cancelar (rojo)

#### ⏸️ En pausa
- **Botón verde**: "Reanudar"
- **Botón rojo**: "Cancelar"
- El progreso se mantiene guardado

#### ✅ Completado
- **Mensaje**: "Análisis completado"
- **Tiempo total** del escaneo
- **Botón**: "Volver a escanear"

### 3. Panel de Mensajes

Ubicado en la parte superior derecha, muestra:
- 📊 **Estadísticas en tiempo real** durante el escaneo
- ℹ️ **Información útil** sobre el proceso
- ⚡ **Consejos** para optimizar el análisis

### 4. Configuración de Exclusiones

#### Campo de Patrones
- **Ubicación**: Debajo de la selección de discos
- **Función**: Excluir carpetas/archivos específicos del análisis
- **Formato**: Separado por comas o un patrón por línea
- **Tecnología**: Usa patrones glob con soporte de comodines

**Ejemplos de patrones comunes:**
```
node_modules, .git, *.tmp, *.cache
AppData/Local/Temp/
$RECYCLE.BIN/
System Volume Information/
Windows/System32/
*.log, *.bak
```

**Exclusiones automáticas del sistema:**
- Archivos del sistema operativo críticos
- Carpetas de caché temporal
- Archivos en uso por otros programas
- Directorios que requieren permisos especiales

#### Explorador de Carpetas
- **Botón**: "Explorar"
- **Función**: Seleccionar visualmente carpetas a excluir
- **Interfaz**: Árbol de carpetas con checkboxes

## 📊 Información Durante el Escaneo

### Barra de Quick Scan muestra:
- **Progreso preciso**: Basado en archivos realmente encontrados (no estimaciones)
- **Ruta actual**: "Analizando: C:\Users\Juan\Documents\proyecto\..."
- **Contador en tiempo real**: "15,234 de ~50,000 archivos procesados"
- **Velocidad**: "~2,500 archivos/segundo" (dependiendo del hardware)

### Barra de Deep Scan muestra:
- **Progreso por contenido**: Basado en bytes procesados, no solo archivos
- **Fase actual**: "Calculando hashes SHA-256...", "Detectando duplicados..."
- **Volumen procesado**: "2.5 GB de 150 GB procesados"
- **Archivos con hash**: "8,450 archivos verificados para duplicados"
- **Rendimiento**: Velocidad adaptativa según tipo de archivos

### Panel de mensajes actualiza con:
- "💡 El Quick Scan ha encontrado 45 posibles duplicados"
- "📁 Se han identificado 12 archivos mayores a 1GB"
- "⚡ Consejo: Puedes empezar a revisar duplicados mientras continúa el Deep Scan"

## 🎮 Acciones Disponibles

### Antes de escanear:
- **Seleccionar disco(s)** para analizar
- **Configurar exclusiones** si es necesario
- **Elegir tipo de escaneo** (Quick, Deep o ambos)

### Durante el escaneo:
- **Pausar**: Detiene temporalmente sin perder progreso
- **Reanudar**: Continúa desde donde se pausó
- **Cancelar**: Detiene y descarta el análisis
- **Ver otras secciones**: Puedes navegar mientras escanea

### Después del escaneo:
- **Ir a Duplicados**: Revisar archivos repetidos encontrados
- **Ir a Archivos Grandes**: Ver los archivos más pesados
- **Volver a escanear**: Actualizar la información

## 🚀 Flujo de Trabajo Típico

1. **Selecciona el disco** que quieres analizar
2. **Configura exclusiones** (opcional):
   - Excluye carpetas del sistema
   - Omite archivos temporales
   - Ignora carpetas de desarrollo (node_modules, etc.)
3. **Haz clic en "Escanear Disco"**
4. **Observa el progreso**:
   - Quick Scan completa primero (2-5 min)
   - Deep Scan continúa en segundo plano
5. **Cuando Quick Scan termine**:
   - Ya puedes ir a "Duplicados" o "Archivos Grandes"
   - El Deep Scan sigue trabajando para mayor precisión
6. **Revisa los resultados** en las otras secciones
7. **Toma acción**: Elimina duplicados, comprime archivos grandes, etc.

## 💡 Consejos y Mejores Prácticas

### Para escaneos más rápidos:
- Excluye carpetas del sistema (Windows, Program Files)
- Omite carpetas de respaldo si no las necesitas analizar
- Cierra otros programas pesados durante el análisis

### Cuándo pausar vs cancelar:
- **Pausa**: Si necesitas usar la computadora para algo pesado temporalmente
- **Cancela**: Si seleccionaste el disco equivocado o cambió tu objetivo

### Frecuencia recomendada:
- **Análisis completo**: Una vez al mes
- **Quick Scan**: Semanalmente si instalas/descargas mucho
- **Después de limpiezas grandes**: Para ver el impacto

## ⚡️ ¿Por qué es tan rápido el Quick Scan? - Tecnología MFT Explicada

### 1. **Acceso Directo a la Master File Table (MFT) - Estructura Técnica**
- **MFT como base de datos nativa**: NTFS almacena **toda la información** (tamaño, timestamps, permisos, ubicación física) en entradas MFT de **1024 bytes**
- **Metaarchivos del sistema**: Los primeros 16 registros MFT pertenecen a archivos del sistema (incluyendo $MFT, $Boot, $LogFile)
- **Un solo acceso inicial**: Lee la estructura MFT completa una vez, evitando miles de operaciones de disco individuales
- **Metadatos completos**: Cada entrada contiene fechas de creación, modificación, acceso, tamaño físico/lógico, ACLs y ubicación en disco
- **Sin navegación recursiva**: Acceso directo a registros MFT evita el costoso proceso de recorrer directorios nivel por nivel

### 2. **DeviceIoControl y FSCTL Commands - APIs Documentadas desde Windows 2000**
- **FSCTL_GET_NTFS_FILE_RECORD**: Acceso directo a registros MFT individuales de 1024 bytes
- **FSCTL_GET_NTFS_VOLUME_DATA**: Obtiene tamaño de MFT y configuración del volumen NTFS
- **FSCTL_GET_RETRIEVAL_POINTERS**: API documentada para obtener posición física de archivos en disco
- **FSCTL_ENUM_USN_DATA**: Enumeración de archivos vía USN Journal (alternativa a parsing directo)
- **Parsing de bajo nivel**: Algunos sistemas usan parsing directo de NTFS para máximo rendimiento
- **APIs de desfragmentación**: Originalmente diseñadas para desfragmentadores, reutilizadas para indexación

### 3. **USN Journal ($UsnJrnl) - Metaarchivo de Change Tracking**
- **Metaarchivo forense**: $UsnJrnl es un archivo especial NTFS que registra todos los eventos del sistema de archivos
- **Habilitado por defecto**: Windows moderno lo activa automáticamente para File History e indexación del sistema
- **Timestamps precisos**: Registra modificaciones, creaciones, eliminaciones, renombrados y cambios de atributos
- **Evidencia de eliminación**: Mantiene rastro de archivos eliminados para reconstrucción forense de timeline
- **Actualizaciones incrementales**: Solo lee entradas nuevas del journal desde la última sincronización
- **Eficiencia extrema**: Actualiza el índice sin re-escanear, procesando solo cambios reales

### 4. **Índice en Memoria y Optimizaciones**
- **Estructura en RAM**: Todo el índice se mantiene en memoria para acceso instantáneo
- **Algoritmos optimizados**: Procesamiento paralelo con Rayon en múltiples hilos
- **Caché inteligente**: Preserva datos entre sesiones para arranques rápidos
- **Compresión de datos**: Reduce huella de memoria manteniendo velocidad

### 5. **Limitaciones y Requisitos Técnicos**
- **Solo NTFS**: No funciona en FAT32, exFAT o unidades de red
- **Permisos administrativos**: Requiere privilegios elevados para acceder a MFT
- **Windows nativo**: Aprovecha APIs específicas de Windows para máximo rendimiento
- **Discos locales**: Optimizado para almacenamiento local, no unidades de red

### 6. **Comparación de Rendimiento**
- **Tradicional**: Escaneo recursivo puede tardar 30+ días en discos grandes
- **DiskDominator**: Mismo análisis completado en 2-5 minutos
- **Mejora documentada**: Hasta 30x más rápido que métodos convencionales
- **Recursos mínimos**: Bajo uso de CPU e I/O durante el escaneo

## 🔒 Privacidad y Seguridad

### Protección de Datos con Tecnología NTFS
- **Acceso de solo lectura a MFT**: Lee únicamente la Master File Table sin acceso a contenido de archivos
- **Metadatos del sistema de archivos**: Nombres, tamaños, timestamps, atributos NTFS nativos
- **USN Journal monitoring**: Detecta cambios en tiempo real sin acceder a datos de usuario
- **Hashes criptográficos en Deep Scan**: SHA-256 calculado por streaming sin cargar archivos completos
- **100% local**: Análisis offline, **zero datos enviados a internet**, sin telemetría
- **Sin modificaciones**: Acceso de solo lectura, **JAMÁS** modifica MFT o archivos
- **Permisos controlados**: Requiere privilegios administrativos para acceso seguro a estructuras NTFS

### Tecnología de Seguridad
- **Sesiones con UUID**: Cada escaneo tiene identificador único para evitar conflictos
- **Operaciones atómicas**: Previene corrupción de datos durante pausa/reanudación  
- **Verificación de permisos**: Respeta automáticamente restricciones del sistema operativo
- **Rollback disponible**: En futuras operaciones, todos los cambios son reversibles
- **Papelera por defecto**: Cuando elimines archivos, van primero a la papelera de reciclaje

## 🤖 Asistente AI

El panel lateral de chat puede ayudarte:
- Sugerir qué carpetas excluir
- Explicar por qué un escaneo tarda más de lo normal
- Recomendar acciones basadas en los resultados

## ❓ Solución de Problemas

**P: El escaneo está muy lento**
- R: Es normal en discos muy llenos o fragmentados. Puedes pausar y continuar más tarde.

**P: El Quick Scan terminó pero no veo resultados**
- R: Ve a las secciones "Duplicados" o "Archivos Grandes" para ver los hallazgos.

**P: ¿Puedo escanear varios discos a la vez?**
- R: Sí, pero será más lento. Recomendamos uno por uno para mejor rendimiento.

**P: El escaneo se detuvo inesperadamente**
- R: Verifica que el disco no tenga errores. Intenta excluir la carpeta donde se detuvo.

## 📈 Interpretación de Resultados con Datos MFT

Después del escaneo MFT, el sistema habrá:
- **Catalogado** todos los archivos directamente desde la Master File Table
- **Construido** índice en memoria con referencias FileRef para acceso instantáneo
- **Identificado** duplicados potenciales usando metadatos NTFS nativos
- **Encontrado** archivos más grandes sin acceder al contenido
- **Configurado** monitoreo USN Journal para actualizaciones automáticas
- **Preparado** datos estructurados para organización y análisis profundo
- **Establecido** baseline para comparaciones futuras y detección de cambios

Ahora puedes usar las otras herramientas de DiskDominator con información precisa y actualizada sobre tu almacenamiento.