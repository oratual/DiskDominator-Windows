# Análisis de BigFilesView - Archivos Gigantes

## 1. Elementos UI Actuales y su Propósito

### AI Assistant (Panel Izquierdo)
- **Chat colapsable** con ancho redimensionable
- **Conversación contextual** sobre archivos grandes
- **Input para comandos** del usuario
- **Divisor visual** para redimensionar

### FileSidebar (Panel de Opciones)
- **Selector de Discos**:
  - Componente DiskSelector
  - Filtrado por disco seleccionado
  
- **Control de Tamaño** (FileSizeSlider):
  - Slider dual para rango mínimo/máximo
  - Thumbs arrastrables para ajustar límites
  - Visualización del rango seleccionado

- **Opciones de Vista**:
  - Lista (FileListView)
  - Explorador (FileExplorerView)

- **Ordenamiento**:
  - Por tamaño, nombre, fecha
  - Dirección ascendente/descendente

### Vista Principal
- **Barra de Acción Superior**:
  - Título y contador de archivos
  - Tamaño total de archivos mostrados
  - Botón "Sugerencias de la IA"

- **Área de Contenido**:
  - FileListView: Lista tabular de archivos
  - FileExplorerView: Vista tipo explorador

- **Barra de Acción Inferior**:
  - Contador de archivos mostrados
  - Botón de ayuda

### Componentes Específicos

#### FileListView
- Tabla con columnas: nombre, tamaño, tipo, ubicación, fecha
- Acciones por archivo: preview, abrir ubicación, eliminar
- Soporte para paginación

#### FileExplorerView
- Vista jerárquica de carpetas
- Navegación tipo Windows Explorer
- Preview de archivos

#### FileSizeSlider
- Control visual para filtrar por tamaño
- Rango dinámico con valores min/max
- Feedback visual del rango seleccionado

## 2. Funciones que Necesitan Implementación en el Backend

### API Endpoints Necesarios

#### Obtener Archivos Grandes
```typescript
GET /api/files/large
Query: {
  disks?: string[],
  minSize: number,
  maxSize?: number,
  types?: string[],
  sortBy?: 'size' | 'name' | 'date' | 'type',
  sortDirection?: 'asc' | 'desc',
  page?: number,
  limit?: number,
  path?: string // Para navegación en explorer
}
Response: {
  files: [{
    id: string,
    name: string,
    path: string,
    disk: string,
    size: number,
    type: string,
    mimeType: string,
    created: Date,
    modified: Date,
    accessed: Date,
    isFolder: boolean,
    thumbnailUrl?: string,
    metadata?: {
      dimensions?: { width: number, height: number },
      duration?: number,
      bitrate?: number,
      compression?: string
    }
  }],
  pagination: {
    total: number,
    page: number,
    pages: number,
    limit: number
  },
  summary: {
    totalSize: number,
    avgSize: number,
    largestFile: FileInfo,
    fileTypeDistribution: Record<string, number>
  }
}
```

#### Analizar Uso de Espacio
```typescript
GET /api/space/analysis
Query: {
  disk?: string,
  path?: string,
  depth?: number
}
Response: {
  tree: {
    path: string,
    size: number,
    fileCount: number,
    children?: SpaceTreeNode[]
  },
  hotspots: [{
    path: string,
    size: number,
    percentage: number,
    fileCount: number,
    largestFiles: FileInfo[]
  }]
}
```

#### Operaciones de Archivos
```typescript
DELETE /api/files/{fileId}
Body: {
  permanent?: boolean,
  shred?: boolean // Eliminación segura
}

POST /api/files/move
Body: {
  fileIds: string[],
  destination: string,
  createFolder?: boolean
}

POST /api/files/compress
Body: {
  fileIds: string[],
  format: 'zip' | '7z' | 'tar.gz',
  compressionLevel?: number,
  deleteOriginal?: boolean
}
```

#### Sugerencias de IA
```typescript
POST /api/files/ai-suggestions
Body: {
  files: string[],
  context?: string
}
Response: {
  suggestions: [{
    type: 'delete' | 'compress' | 'move' | 'archive',
    fileIds: string[],
    reason: string,
    estimatedSavings: number,
    confidence: number
  }],
  insights: {
    duplicatePatterns: string[],
    unusedFiles: FileInfo[],
    compressibleFiles: FileInfo[],
    organizationTips: string[]
  }
}
```

#### Generación de Previews
```typescript
GET /api/files/{fileId}/preview
Query: {
  type: 'thumbnail' | 'full' | 'metadata'
}
Response: {
  preview: string, // Base64 o URL
  metadata: object,
  canOpen: boolean,
  suggestedApps: string[]
}
```

## 3. Estructuras de Datos Requeridas

### Modelos de Base de Datos

#### LargeFile Model
```typescript
interface LargeFile {
  id: string;
  path: string;
  diskId: string;
  size: bigint;
  mimeType: string;
  category: 'video' | 'image' | 'audio' | 'document' | 'archive' | 'executable' | 'other';
  hash?: string; // Para detectar duplicados grandes
  created: Date;
  modified: Date;
  accessed: Date;
  scanSessionId: string;
  metadata?: {
    isCompressed: boolean;
    compressionRatio?: number;
    potentialSaving?: number; // Si se comprime
    lastOpened?: Date;
    openCount?: number;
  };
}
```

#### FileSpaceAnalysis Model
```typescript
interface FileSpaceAnalysis {
  id: string;
  path: string;
  totalSize: bigint;
  fileCount: number;
  folderCount: number;
  analyzedAt: Date;
  breakdown: {
    byType: Record<string, bigint>;
    byAge: {
      lessThan30Days: bigint;
      lessThan90Days: bigint;
      lessThan1Year: bigint;
      moreThan1Year: bigint;
    };
    byAccess: {
      neverAccessed: bigint;
      notAccessedIn90Days: bigint;
      recentlyAccessed: bigint;
    };
  };
}
```

#### FileOperation Model
```typescript
interface FileOperation {
  id: string;
  type: 'delete' | 'move' | 'compress' | 'rename';
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  files: string[];
  startedAt: Date;
  completedAt?: Date;
  error?: string;
  result?: {
    processedFiles: number;
    failedFiles: number;
    spaceSaved?: bigint;
    newLocation?: string;
  };
  userId: string;
  reversible: boolean;
  reverseOperationId?: string;
}
```

## 4. Puntos de Integración con la Arquitectura Modular

### Integración con Módulos Core

#### space-analyzer
- Análisis profundo de uso de espacio
- Generación de mapas de calor
- Detección de hotspots

#### file-classifier
- Categorización automática de archivos
- Detección de tipos MIME
- Análisis de contenido

#### preview-generator
- Generación de miniaturas
- Extracción de metadata
- Preview de documentos

#### compression-engine
- Estimación de ahorro por compresión
- Compresión en background
- Soporte multi-formato

### Eventos del Sistema
```typescript
// Eventos del módulo
'largeFile:found'
'file:analyzed'
'space:hotspot:detected'
'file:operation:started'
'file:operation:completed'
'file:operation:failed'
'preview:generated'
```

### Comunicación con Scanner
```typescript
// Integración con el scanner principal
scanner.on('file:scanned', async (file) => {
  if (file.size > threshold) {
    await largeFileModule.analyze(file);
    emit('largeFile:found', file);
  }
});
```

## 5. Identificación de Datos Reales vs Mock

### Datos Actualmente Mockeados

1. **largeFiles** (importado de utils)
   - Lista estática de archivos de ejemplo
   - Sin conexión con sistema real

2. **availableDisks** (importado de utils)
   - 4 discos hardcodeados
   - Sin detección del sistema

3. **Operaciones simuladas**
   - Preview, delete, move sin implementación
   - Solo feedback visual

### Implementación de Datos Reales

```typescript
// Hook para archivos grandes
const {
  files,
  loading,
  error,
  totalSize,
  refetch
} = useLargeFiles({
  minSize: parseSizeString(minFileSize),
  maxSize: calculateMaxSize(maxSizeThumb),
  disks: selectedDisks,
  sortBy,
  sortDirection,
  page: currentPage,
  limit: itemsPerPage
});

// Sistema de preview real
const generatePreview = async (fileId: string) => {
  const preview = await api.getFilePreview(fileId);
  return {
    url: preview.url,
    type: preview.type,
    metadata: preview.metadata
  };
};

// Operaciones reales
const handleDelete = async (files: string[]) => {
  const operation = await api.deleteFiles(files, {
    moveToTrash: !shiftPressed,
    showProgress: true
  });
  
  await operation.onProgress((progress) => {
    updateUI(progress);
  });
  
  return operation.result;
};
```

## 6. Funcionalidades Adicionales Identificadas

### Análisis Avanzado
1. **Mapa de calor de espacio**
   - Visualización tipo TreeMap
   - Drill-down interactivo
   - Colores por tipo/antigüedad

2. **Análisis temporal**
   - Gráfico de crecimiento
   - Predicción de espacio futuro
   - Alertas de espacio bajo

3. **Detección de patrones**
   - Archivos temporales grandes
   - Caches de aplicaciones
   - Logs antiguos

### Operaciones Batch
1. **Selección múltiple avanzada**
   - Selección por patrón
   - Selección por fecha
   - Selección por tipo

2. **Operaciones programadas**
   - Limpieza automática
   - Compresión programada
   - Movimiento a archivo

3. **Presets de limpieza**
   - "Liberar espacio rápido"
   - "Limpieza profunda"
   - "Archivar antiguos"

### Integraciones
1. **Cloud storage**
   - Mover a OneDrive/Google Drive
   - Sincronización selectiva
   - Gestión de espacio cloud

2. **Herramientas externas**
   - Abrir en editor específico
   - Enviar a compresor externo
   - Análisis con antivirus

## 7. Algoritmos y Lógica de Negocio

### Clasificación de Archivos
```typescript
// Categorización inteligente
const categorizeFile = (file: FileInfo): FileCategory => {
  // Por extensión
  if (videoExtensions.includes(file.ext)) return 'video';
  if (imageExtensions.includes(file.ext)) return 'image';
  
  // Por MIME type
  if (file.mimeType?.startsWith('video/')) return 'video';
  
  // Por contenido (magic numbers)
  const header = await readFileHeader(file.path);
  return detectTypeByMagicNumber(header);
};
```

### Cálculo de Tamaño Eficiente
```typescript
// Conversión de slider a bytes
const sliderToBytes = (value: number): number => {
  // Escala logarítmica para mejor UX
  const minLog = Math.log10(1024 * 1024); // 1MB
  const maxLog = Math.log10(1024 * 1024 * 1024 * 1024); // 1TB
  const range = maxLog - minLog;
  const logValue = minLog + (range * value / 100);
  return Math.pow(10, logValue);
};
```

### Sugerencias Inteligentes
```typescript
// Motor de sugerencias
const generateSuggestions = async (files: LargeFile[]) => {
  const suggestions = [];
  
  // Archivos no accedidos en 6 meses
  const oldFiles = files.filter(f => 
    daysSince(f.accessed) > 180
  );
  if (oldFiles.length > 0) {
    suggestions.push({
      type: 'archive',
      files: oldFiles,
      reason: 'No accedidos en 6 meses',
      savings: sum(oldFiles.map(f => f.size))
    });
  }
  
  // Archivos comprimibles
  const compressible = files.filter(f => 
    !f.metadata.isCompressed && 
    compressibleTypes.includes(f.type)
  );
  
  return suggestions;
};
```

## 8. Tareas de Implementación Prioritarias

### Alta Prioridad
1. Conexión con datos reales del scanner
2. Implementar paginación funcional
3. Sistema de preview básico
4. Operación de eliminación con confirmación

### Media Prioridad
1. FileSizeSlider funcional con datos reales
2. Ordenamiento del lado del servidor
3. Generación de thumbnails
4. Análisis de espacio básico

### Baja Prioridad
1. Mapa de calor interactivo
2. Operaciones batch avanzadas
3. Integración con cloud storage
4. Análisis predictivo

## 9. Consideraciones de Rendimiento

### Optimización de Consultas
1. **Índices necesarios**:
   - size (para ordenamiento rápido)
   - disk + size (para filtros combinados)
   - modified (para filtros temporales)

2. **Paginación eficiente**:
   - Cursor-based para datasets grandes
   - Precarga de página siguiente
   - Caché de páginas visitadas

### Optimización de UI
1. **Lazy loading de previews**:
   - Generar bajo demanda
   - Caché en memoria/disco
   - Placeholder mientras carga

2. **Virtual scrolling**:
   - Para listas de miles de archivos
   - Renderizar solo visible
   - Reciclaje de componentes

## 10. Seguridad y Validaciones

### Validaciones de Entrada
```typescript
// Validación de rangos de tamaño
const validateSizeRange = (min: number, max: number) => {
  if (min < 0) throw new Error('Size cannot be negative');
  if (max < min) throw new Error('Max must be greater than min');
  if (max > MAX_FILE_SIZE) throw new Error('Size exceeds system limits');
};

// Validación de rutas
const validatePath = (path: string) => {
  if (path.includes('..')) throw new Error('Path traversal detected');
  if (!isAbsolutePath(path)) throw new Error('Must be absolute path');
  if (isSystemPath(path)) throw new Error('Cannot modify system files');
};
```

### Permisos y Acceso
1. **Verificación de permisos**:
   - Lectura antes de preview
   - Escritura antes de eliminar
   - Acceso a rutas del usuario

2. **Límites de operación**:
   - Max archivos por operación
   - Timeout para operaciones largas
   - Rate limiting para API

## 11. Testing y Calidad

### Casos de Prueba Críticos
1. **Rendimiento con muchos archivos**:
   - 10,000+ archivos
   - Filtrado y ordenamiento
   - Tiempo de respuesta < 1s

2. **Precisión de tamaños**:
   - Cálculos exactos
   - Conversión de unidades
   - Redondeo consistente

3. **Operaciones concurrentes**:
   - Múltiples eliminaciones
   - Cancelación de operaciones
   - Integridad de datos