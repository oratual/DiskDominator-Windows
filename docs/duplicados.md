# Análisis de DuplicatesView - Gestión de Duplicados

## 1. Elementos UI Actuales y su Propósito

### AI Assistant Panel (Izquierda)
- **Chat colapsable** con historial de conversación
- **Mensajes contextuales** sobre duplicados encontrados
- **Input de usuario** para instrucciones específicas
- **Sugerencias** de filtrado y organización

### Sidebar de Opciones
- **Selector de Discos**: 
  - Componente DiskSelector con checkboxes
  - Muestra espacio usado/total por disco
  - Permite filtrar duplicados por ubicación

- **Acciones Rápidas**:
  - Vista mejorada (EnhancedDuplicates)
  - Vista clásica (lista tradicional)

- **Espacio Recuperable**:
  - Total de espacio que se puede liberar
  - Desglose por disco con barras de progreso
  - Estadísticas detalladas (elementos, copias, seleccionados)

- **Opciones de Vista**:
  - Lista o Explorador
  - Toggles para cambiar visualización

- **¿Qué Copia Conservar?**:
  - La más reciente
  - La original (más antigua)
  - Selección manual

- **Filtros por Tipo**:
  - Todos, Carpetas, Archivos
  - Imágenes, Videos

### Vista Principal
- **Guía Rápida**: 
  - Banner informativo con códigos de color
  - Verde = conservar, Rojo = eliminar
  - Iconos de acciones disponibles

- **Lista de Duplicados**:
  - Grupos expandibles/colapsables
  - Información por grupo: nombre, copias, tamaño, recuperable
  - Detalles por copia: ruta, fecha, tamaño, acciones

- **Barra de Acciones Inferior**:
  - Contador de elementos seleccionados
  - Barra de progreso del total recuperable
  - Botones: Deshacer, Eliminar seleccionados

### Vista Mejorada (EnhancedDuplicates)
- Componente separado con funcionalidades adicionales
- Comparación lado a lado de archivos

## 2. Funciones que Necesitan Implementación en el Backend

### API Endpoints Necesarios

#### Obtener Duplicados
```typescript
GET /api/duplicates
Query: {
  disks?: string[],
  types?: string[],
  minSize?: number,
  maxSize?: number,
  sortBy?: 'size' | 'count' | 'date',
  groupBy?: 'hash' | 'name' | 'size'
}
Response: {
  groups: [{
    id: string,
    hash: string,
    name: string,
    type: 'file' | 'folder',
    fileType?: 'image' | 'video' | 'document' | 'audio' | 'other',
    totalSize: number,
    recoverableSize: number,
    copies: [{
      id: string,
      path: string,
      disk: string,
      size: number,
      created: Date,
      modified: Date,
      accessed: Date,
      isOriginal: boolean,
      keepSuggestion: boolean,
      metadata?: {
        width?: number,
        height?: number,
        duration?: number,
        bitrate?: number
      }
    }]
  }],
  summary: {
    totalGroups: number,
    totalDuplicates: number,
    totalSize: number,
    recoverableSize: number
  }
}
```

#### Marcar para Conservar/Eliminar
```typescript
PUT /api/duplicates/{groupId}/keep
Body: {
  keepIds: string[],
  deleteIds: string[]
}
```

#### Eliminar Duplicados
```typescript
DELETE /api/duplicates/batch
Body: {
  ids: string[],
  moveToTrash: boolean,
  permanentDelete: boolean
}
Response: {
  deleted: string[],
  failed: [{
    id: string,
    error: string
  }],
  spaceSaved: number
}
```

#### Comparar Archivos
```typescript
GET /api/files/compare
Query: {
  file1: string,
  file2: string
}
Response: {
  identical: boolean,
  differences: {
    size: boolean,
    content: boolean,
    metadata: object
  },
  preview?: {
    file1: string, // base64 o URL
    file2: string
  }
}
```

#### Auto-Selección Inteligente
```typescript
POST /api/duplicates/auto-select
Body: {
  strategy: 'keep-newest' | 'keep-oldest' | 'keep-in-organized' | 'ai-suggestion',
  groups: string[]
}
Response: {
  selections: [{
    groupId: string,
    keepIds: string[],
    deleteIds: string[],
    reason: string
  }]
}
```

## 3. Estructuras de Datos Requeridas

### Modelos de Base de Datos

#### DuplicateGroup Model
```typescript
interface DuplicateGroup {
  id: string;
  hash: string; // SHA-256 del contenido
  size: number;
  type: 'file' | 'folder';
  mimeType?: string;
  firstSeen: Date;
  lastUpdated: Date;
  scanSessionId: string;
}
```

#### DuplicateFile Model
```typescript
interface DuplicateFile {
  id: string;
  groupId: string;
  path: string;
  diskId: string;
  size: bigint;
  created: Date;
  modified: Date;
  accessed: Date;
  attributes: {
    hidden: boolean;
    system: boolean;
    readonly: boolean;
  };
  metadata?: {
    // Para imágenes
    width?: number;
    height?: number;
    format?: string;
    // Para videos
    duration?: number;
    codec?: string;
    bitrate?: number;
    // Para documentos
    pages?: number;
    author?: string;
  };
  isDeleted: boolean;
  deletedAt?: Date;
}
```

#### DuplicateSelectionRule Model
```typescript
interface DuplicateSelectionRule {
  id: string;
  userId: string;
  name: string;
  priority: number;
  conditions: {
    type: 'location' | 'date' | 'name' | 'size';
    operator: 'contains' | 'equals' | 'greater' | 'less';
    value: any;
  }[];
  action: 'keep' | 'delete';
  enabled: boolean;
}
```

## 4. Puntos de Integración con la Arquitectura Modular

### Integración con Módulos Core

#### duplicate-detector
- Algoritmos de detección de duplicados
- Cálculo de hashes optimizado
- Comparación de contenido

#### file-comparator
- Comparación binaria de archivos
- Generación de previews
- Análisis de diferencias

#### selection-engine
- Motor de reglas para auto-selección
- Aplicación de estrategias predefinidas
- Sugerencias basadas en IA

#### deletion-manager
- Eliminación segura de archivos
- Gestión de papelera de reciclaje
- Rollback de operaciones

### Eventos del Sistema
```typescript
// Eventos a emitir/escuchar
'duplicates:found'
'duplicate:selected'
'duplicate:deselected'
'duplicates:deleted'
'duplicates:delete:failed'
'selection:strategy:applied'
```

## 5. Identificación de Datos Reales vs Mock

### Datos Actualmente Mockeados

1. **duplicateItems** (línea 161-249)
   - 3 grupos de ejemplo hardcodeados
   - Reemplazar con datos del scanner

2. **availableDisks** (línea 252-257)
   - 4 discos con datos estáticos
   - Usar detección real del sistema

3. **Selecciones keep/delete**
   - Actualmente solo cambian UI
   - Implementar persistencia real

### Implementación de Datos Reales

```typescript
// Hook para cargar duplicados
const { 
  data: duplicates, 
  loading, 
  error,
  refetch 
} = useDuplicates({
  disks: selectedDisks,
  types: selectedType,
  minSize: parseSize(minFileSize)
});

// Hook para operaciones
const { 
  markForDeletion,
  markForKeeping,
  executeDeletion,
  undoLastOperation
} = useDuplicateOperations();

// WebSocket para actualizaciones
useEffect(() => {
  const ws = connectDuplicatesWS();
  ws.on('duplicate:deleted', (id) => {
    refetch();
  });
  return () => ws.close();
}, []);
```

## 6. Funcionalidades Adicionales Identificadas

### Análisis Avanzado
1. **Detección de carpetas duplicadas**
   - Comparar estructura completa
   - Identificar carpetas idénticas

2. **Duplicados parciales**
   - Archivos similares pero no idénticos
   - Versiones de archivos

3. **Análisis de patrones**
   - Detectar backups automáticos
   - Identificar copias de seguridad

### Funciones de Organización
1. **Mover en lugar de eliminar**
   - Consolidar en ubicación única
   - Crear enlaces simbólicos

2. **Renombrado inteligente**
   - Resolver conflictos de nombres
   - Añadir sufijos descriptivos

3. **Exportar lista**
   - CSV con todos los duplicados
   - Script de eliminación

### Seguridad y Recuperación
1. **Snapshot antes de eliminar**
   - Guardar estado actual
   - Permitir restauración completa

2. **Verificación de integridad**
   - Confirmar que queda al menos una copia
   - Prevenir eliminación accidental de únicos

3. **Cuarentena temporal**
   - Mover a carpeta temporal antes de eliminar
   - Período de gracia de 30 días

## 7. Algoritmos de Detección Necesarios

### Detección Rápida
```typescript
// Paso 1: Agrupar por tamaño
const sizeGroups = files.groupBy(f => f.size);

// Paso 2: Hash parcial (primeros y últimos 1MB)
const quickHash = async (file) => {
  const start = await readBytes(file, 0, 1048576);
  const end = await readBytes(file, -1048576);
  return sha256(start + end);
};

// Paso 3: Hash completo solo para candidatos
const fullHash = async (candidates) => {
  return sha256(await readFile(candidates));
};
```

### Detección de Carpetas
```typescript
// Algoritmo para carpetas duplicadas
1. Calcular hash del árbol de archivos
2. Comparar estructura y contenido
3. Identificar carpetas idénticas o subset
```

### Selección Inteligente
```typescript
// Factores para auto-selección
1. Ubicación (organized > downloads > temp)
2. Fecha (original > copias)
3. Nombre (sin sufijos > con (1), (2), etc)
4. Acceso (más usado > menos usado)
5. Contexto (en proyecto activo > archivo)
```

## 8. Tareas de Implementación Prioritarias

### Alta Prioridad
1. Conectar con datos reales del scanner
2. Implementar eliminación segura con confirmación
3. Sistema de selección múltiple funcional
4. Persistencia de selecciones

### Media Prioridad
1. Comparación visual lado a lado
2. Auto-selección con reglas básicas
3. Deshacer última operación
4. Filtros avanzados

### Baja Prioridad
1. Detección de carpetas duplicadas
2. Exportación de resultados
3. Reglas personalizadas de selección
4. Análisis de patrones

## 9. Consideraciones de Rendimiento

### Optimización de Carga
1. **Paginación**: Cargar grupos de 50 en 50
2. **Lazy loading**: Expandir detalles bajo demanda
3. **Virtual scrolling**: Para listas largas
4. **Caché de previews**: Guardar miniaturas

### Optimización de Operaciones
1. **Batch operations**: Eliminar en lotes
2. **Background processing**: Operaciones asíncronas
3. **Progress tracking**: Mostrar progreso real
4. **Cancelable operations**: Permitir cancelar

## 10. Integración con AI

### Sugerencias Inteligentes
```typescript
// Prompt para AI
const getAISuggestion = async (duplicates) => {
  return await ai.suggest({
    context: "duplicate_files",
    data: duplicates,
    userPreferences: settings,
    prompt: "Suggest which files to keep based on organization best practices"
  });
};
```

### Análisis de Contenido
1. **OCR para documentos**: Comparar contenido real
2. **Reconocimiento de imágenes**: Detectar similares
3. **Análisis de calidad**: Sugerir mejor versión

## 11. Métricas y Analytics

### Métricas a Rastrear
1. **Espacio liberado**: Total y por sesión
2. **Archivos eliminados**: Cantidad y tipos
3. **Tiempo ahorrado**: Estimación de organización manual
4. **Patrones de uso**: Qué filtros se usan más

### Dashboard de Estadísticas
```typescript
interface DuplicateStats {
  totalScanned: number;
  duplicatesFound: number;
  spaceWasted: number;
  spaceSaved: number;
  mostDuplicatedFiles: FileInfo[];
  duplicateHotspots: string[]; // Carpetas con más duplicados
}
```