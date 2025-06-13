# 🔄 Guía de Usuario - Duplicados

## ¿Qué es la Herramienta de Duplicados?

La sección de Duplicados es una potente herramienta que encuentra archivos idénticos en tu sistema para ayudarte a:
- Liberar espacio eliminando copias innecesarias
- Organizar mejor tus archivos
- Identificar backups redundantes
- Limpiar descargas repetidas

## 🎯 Funcionamiento Inteligente

### Sistema de Detección
DiskDominator puede encontrar duplicados usando varios métodos:

#### 🔬 Por Contenido (Hash)
- **Más preciso**: Compara el contenido real de los archivos
- **100% confiable**: Solo marca como duplicados archivos idénticos bit por bit
- **Ideal para**: Archivos importantes donde la precisión es crítica

#### 📝 Por Nombre
- **Más rápido**: Solo compara nombres de archivo
- **Útil para**: Encontrar archivos con nombres duplicados (ej: "foto.jpg", "foto(1).jpg")

#### 📏 Por Tamaño
- **Búsqueda rápida**: Agrupa archivos del mismo tamaño
- **Mejor combinado**: Usar junto con verificación de nombre

#### 🎯 Por Nombre y Tamaño
- **Balance perfecto**: Rápido y relativamente preciso
- **Recomendado para**: Primera exploración rápida

## 🖥️ Elementos de la Interfaz

### 1. Panel de Asistente AI (Izquierda)

El asistente puede ayudarte a:
- Decidir qué archivos conservar
- Entender por qué tienes duplicados
- Sugerir estrategias de limpieza
- Responder preguntas sobre tus archivos

**Ejemplos de comandos útiles:**
- "Encuentra duplicados de fotos que no he usado en 6 meses"
- "¿Cuáles son los videos duplicados más grandes?"
- "Ayúdame a limpiar mi carpeta de descargas"

### 2. Panel de Configuración (Centro-Izquierda)

#### 📀 Selector de Discos
- **Selección múltiple**: Analiza varios discos a la vez
- **Indicadores visuales**: Muestra uso de cada disco
- **Filtrado inteligente**: Solo busca donde especifiques

#### ⚡ Acciones Rápidas
- **Vista mejorada**: Interfaz moderna con más opciones
- **Vista clásica**: Diseño simple y directo

#### 💾 Espacio Recuperable
Panel informativo que muestra:
- **Total recuperable**: Cuánto espacio puedes liberar
- **Por disco**: Impacto en cada unidad
- **Elementos encontrados**: Cantidad de duplicados
- **Vista detallada**: Expándelo para más información

### 3. Panel Principal (Derecha)

#### 📋 Lista de Duplicados
Cada grupo de duplicados muestra:
- **Icono del tipo**: 📁 Carpetas, 🖼️ Imágenes, 🎥 Videos, 📄 Documentos
- **Nombre del archivo**
- **Cantidad de copias** encontradas
- **Tamaño total** ocupado
- **Espacio recuperable** si eliminas las copias extra

#### 🔍 Vista Expandida
Al hacer clic en un grupo:
- **Lista todas las copias** con su ubicación completa
- **Fecha de modificación** de cada copia
- **Tamaño individual**
- **Marcadores visuales**:
  - 🟢 ⭐ **Verde con estrella**: Copia que se conservará
  - 🔴 🗑️ **Rojo con papelera**: Copia marcada para eliminar

## 🎮 Opciones de Configuración

### ¿Qué Copia Conservar?

#### 🕐 La más reciente
- **Ideal para**: Documentos de trabajo actualizados
- **Conserva**: La versión con fecha de modificación más nueva

#### 📅 La original (más antigua)
- **Ideal para**: Fotos y archivos históricos
- **Conserva**: La primera versión creada

#### ✋ Selección manual
- **Control total**: Tú decides qué conservar en cada caso
- **Recomendado para**: Archivos importantes o complejos

### Tipo de Elementos

Filtra por categoría:
- **Todos**: Busca todo tipo de duplicados
- **Carpetas**: Solo carpetas completas duplicadas
- **Archivos**: Solo archivos individuales
- **Imágenes**: JPG, PNG, etc.
- **Videos**: MP4, AVI, MOV, etc.

### Método de Detección

Elige según tus necesidades:
- **Por contenido**: Máxima precisión (más lento)
- **Por nombre**: Encuentra nombres repetidos (más rápido)
- **Por tamaño**: Agrupa por tamaño de archivo
- **Por nombre y tamaño**: Balance velocidad/precisión

### Selección Inteligente

Estrategias automáticas:
- **Conservar más recientes**: Mantiene archivos actualizados
- **Conservar más antiguos**: Preserva originales
- **Conservar organizados**: Prefiere archivos en carpetas estructuradas
- **Sugerencia AI**: El asistente analiza y recomienda

### Filtros Avanzados

- **Tamaño mínimo**: Ignora archivos pequeños (ej: "1MB", "500KB")
- **Útil para**: Enfocarse en archivos que realmente ocupan espacio

## 📊 Flujo de Trabajo Típico

### 1. Configuración Inicial
1. **Selecciona los discos** a analizar
2. **Elige el método de detección** (recomendado: "Por contenido")
3. **Configura filtros** si necesitas (tamaño mínimo, tipos)
4. **Selecciona estrategia** de conservación

### 2. Análisis
1. El sistema escanea los discos seleccionados
2. Agrupa archivos idénticos
3. Calcula espacio recuperable
4. Aplica tu estrategia de selección

### 3. Revisión
1. **Examina cada grupo** de duplicados
2. **Verifica las selecciones** automáticas
3. **Ajusta manualmente** si es necesario
4. **Usa el asistente AI** para casos dudosos

### 4. Vista Previa
- Haz clic en **👁️ ojo** para ver vista previa (imágenes)
- Usa **📁 carpeta** para abrir ubicación en explorador
- Verifica antes de eliminar archivos importantes

### 5. Limpieza
1. Revisa el resumen en la barra inferior
2. Confirma cantidad de archivos y espacio a liberar
3. Haz clic en **"Eliminar elementos seleccionados"**
4. Confirma en el diálogo de seguridad

## 💡 Consejos y Mejores Prácticas

### Para Mejores Resultados
1. **Empieza con un disco**: No analices todo de una vez
2. **Usa detección por contenido**: Para archivos importantes
3. **Revisa carpetas de descargas**: Suelen tener más duplicados
4. **Backup primero**: Crea respaldo de archivos críticos

### Estrategias Efectivas
- **Fotos**: Conserva las originales (más antiguas)
- **Documentos**: Mantén las versiones más recientes
- **Descargas**: Elimina copias en carpeta de descargas
- **Backups**: Identifica y consolida respaldos redundantes

### Precauciones
- **No elimines archivos del sistema**
- **Verifica programas instalados** antes de eliminar
- **Cuidado con proyectos** que requieren archivos "duplicados"
- **Revisa papelera de reciclaje** después de limpiar

## 🛡️ Seguridad y Protección Avanzada

### Sistema de Confirmación Multi-Nivel
1. **Selección visual inteligente**: Verde = conservar, Rojo = eliminar con justificación
2. **Resumen estadístico**: Archivos, espacio recuperable, tipos de archivo afectados
3. **Vista previa granular**: Examina cada archivo antes de confirmación final
4. **Diálogo de doble confirmación**: Para operaciones que afectan >100 archivos
5. **Papelera de reciclaje por defecto**: Eliminación reversible (mover, no destruir)

### Protecciones Automáticas del Sistema
- **Exclusión inteligente**: Detecta automáticamente archivos críticos del SO
- **Verificación de bloqueo**: Detecta archivos en uso por otros procesos
- **Garantía de copia**: Algoritmo asegura que al menos una copia siempre permanece
- **Verificación de permisos**: Respeta restricciones de seguridad del sistema
- **Rollback completo**: Operación reversible con registro de cambios

### Tecnología de Seguridad
- **Transacciones atómicas**: Todo se ejecuta completamente o nada
- **Log de auditoria**: Registro detallado de todas las operaciones
- **Verificación de integridad**: Comprueba que los archivos no se corrompan
- **Backup automático**: Crea puntos de restauración antes de operaciones masivas

## 🤖 Uso del Asistente AI

### Comandos Útiles
- "¿Qué fotos puedo eliminar sin riesgo?"
- "Encuentra duplicados de videos grandes"
- "Ayúdame a limpiar mi escritorio"
- "¿Por qué tengo tantas copias de este archivo?"

### Capacidades del Asistente
- **Análisis contextual**: Entiende tu estructura de archivos
- **Recomendaciones personalizadas**: Basadas en tu uso
- **Explicaciones**: Te dice por qué algo es seguro eliminar
- **Historial**: Recuerda decisiones anteriores

## ❓ Preguntas Frecuentes

**P: ¿Es seguro eliminar todos los duplicados?**
R: No automáticamente. Revisa cada grupo, especialmente archivos de programas o proyectos.

**P: ¿Por qué algunos archivos idénticos no aparecen?**
R: Verifica el método de detección y los filtros de tamaño mínimo.

**P: ¿Puedo recuperar archivos eliminados?**
R: Sí, van a la papelera de reciclaje primero. Puedes restaurarlos desde ahí.

**P: ¿Qué pasa con los accesos directos?**
R: Los accesos directos (.lnk) no se consideran duplicados del archivo original.

**P: ¿Funciona con archivos en la nube?**
R: Solo con archivos sincronizados localmente en tu disco.

## 🚀 Funciones Avanzadas

### Vista Mejorada (Enhanced Mode)
Accede desde "Acciones rápidas" para funcionalidades avanzadas:
- **Visualización jerárquica**: Árbol de carpetas con indicadores de duplicados
- **Comparación binaria**: Vista lado a lado con diferencias resaltadas
- **Operaciones en lote**: Procesamiento paralelo optimizado con Rayon
- **Estadísticas en tiempo real**: Gráficos interactivos por tipo/ubicación/fecha
- **Filtros dinámicos**: Búsqueda instantánea con expresiones regulares

### Motor de Rendimiento
- **Procesamiento paralelo**: Utiliza todos los núcleos de CPU disponibles
- **Caché inteligente**: Reutiliza hashes calculados en sesiones previas
- **Streaming de archivos**: Procesa archivos grandes sin cargar en memoria
- **Paginación virtual**: Maneja listas de miles de duplicados sin lag
- **Optimización adaptativa**: Ajusta algoritmos según hardware disponible

### Exportar Resultados
- Guarda lista de duplicados encontrados
- Útil para revisión posterior
- Formato CSV para análisis externo

### Programar Limpiezas
- Configura análisis automáticos
- Notificaciones de duplicados nuevos
- Limpieza automática (con precaución)

## 📈 Interpretación de Resultados

### Indicadores de Éxito
- **Espacio recuperado**: Meta alcanzada de limpieza
- **Archivos organizados**: Menos desorden digital
- **Rendimiento mejorado**: Disco más rápido con menos archivos

### Métricas Importantes
- **Ratio de duplicados**: % de espacio en duplicados
- **Tamaño promedio**: Identifica tipos problemáticos
- **Ubicaciones frecuentes**: Dónde se acumulan duplicados