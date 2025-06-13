# Análisis de OrganizeView - Ordenar Disco

## 1. Elementos UI Actuales y su Propósito

### AI Assistant Panel (Izquierda)
- **Chat colapsable** con historial de conversación
- **Ejemplo de interacción**: Organizar proyectos Unreal Engine por antigüedad
- **Input para instrucciones** del usuario
- **Sugerencias contextuales**

### Panel Principal con Tabs
- **Tab Exploración**:
  - Controles de layout (single, horizontal, vertical, grid)
  - Carousel de tips con navegación
  - FileExplorer con diferentes configuraciones según layout

- **Tab Visualización**:
  - Cambios propuestos por la IA
  - Cards con detalles de cada operación
  - Código de colores por tipo de acción

- **Tab Resumen**:
  - Resumen textual del plan
  - Lista de archivos afectados
  - Estadísticas de la operación

### Controles de Layout
- **Vista Única**: Un solo panel explorador
- **Vista Horizontal**: Dos paneles lado a lado (origen/destino)
- **Vista Vertical**: Dos paneles arriba/abajo
- **Vista Cuadrícula**: 4 paneles (múltiples ubicaciones)

### Divisores Redimensionables
- **Chat**: Redimensionable horizontalmente
- **Paneles de exploración**: Según el layout seleccionado
- **Indicadores visuales**: Hover effects en divisores

### Sistema de Tips (Carousel)
- **5 consejos rotativos** sobre organización
- **Navegación manual** con flechas
- **Auto-rotación** cada 8 segundos
- **Pausa al interactuar**

### Plan de Confirmación
- **Botón "Confirmar Plan"**: Ejecuta las operaciones
- **Botón "Cancelar Plan"**: Descarta los cambios
- **Grupo visual**: Destacado con fondo diferente

## 2. Funciones que Necesitan Implementación en el Backend

### API Endpoints Necesarios

#### Análisis de Organización
```typescript
POST /api/organize/analyze
Body: {
  paths: string[],
  rules?: OrganizationRule[],
  aiPrompt?: string
}
Response: {
  suggestions: [{
    id: string,
    type: 'move' | 'rename' | 'group' | 'delete' | 'archive',
    title: string,
    description: string,
    fromPaths: string[],
    toPath: string,
    affectedFiles: FileInfo[],
    estimatedTime: number,
    confidence: number,
    reason: string
  }],
  insights: {
    disorganizedFolders: string[],
    namingInconsistencies: string[],
    duplicateStructures: string[],
    unusedDirectories: string[]
  }
}
```

#### Crear Plan de Organización
```typescript
POST /api/organize/plan
Body: {
  name: string,
  suggestions: string[], // IDs de sugerencias aceptadas
  customOperations?: [{
    type: string,
    source: string[],
    destination: string,
    options: object
  }]
}
Response: {
  planId: string,
  operations: Operation[],
  preview: {
    before: FolderStructure,
    after: FolderStructure,
    changes: Change[]
  },
  estimatedDuration: number,
  requiredSpace: number
}
```

#### Ejecutar Plan
```typescript
POST /api/organize/execute/{planId}
Body: {
  dryRun?: boolean,
  createBackup?: boolean,
  notifyOnComplete?: boolean
}
Response: {
  executionId: string,
  status: 'started' | 'in_progress' | 'completed' | 'failed',
  progress: {
    current: number,
    total: number,
    currentOperation: string
  }
}

// WebSocket para progreso
WS /api/organize/progress/{executionId}
```

#### Reglas de Organización
```typescript
GET /api/organize/rules
Response: {
  systemRules: Rule[],
  userRules: Rule[],
  templates: [{
    id: string,
    name: string,
    description: string,
    rules: Rule[]
  }]
}

POST /api/organize/rules
Body: {
  name: string,
  condition: {
    type: 'extension' | 'name' | 'date' | 'size' | 'content',
    operator: string,
    value: any
  },
  action: {
    type: 'move' | 'rename' | 'group',
    destination: string,
    pattern?: string
  }
}
```

#### AI-Powered Organization
```typescript
POST /api/organize/ai-plan
Body: {
  prompt: string,
  context: {
    currentPath: string,
    fileTypes: string[],
    constraints?: string[]
  }
}
Response: {
  plan: {
    understanding: string, // Lo que entendió la IA
    operations: [{
      description: string,
      type: string,
      files: FileMatch[],
      destination: string,
      reason: string
    }],
    warnings: string[],
    alternatives: string[]
  }
}
```

## 3. Estructuras de Datos Requeridas

### Modelos de Base de Datos

#### OrganizationPlan Model
```typescript
interface OrganizationPlan {
  id: string;
  userId: string;
  name: string;
  description: string;
  createdAt: Date;
  status: 'draft' | 'ready' | 'executing' | 'completed' | 'failed';
  operations: PlanOperation[];
  metadata: {
    totalFiles: number;
    totalSize: bigint;
    estimatedDuration: number;
    affectedPaths: string[];
  };
  aiGenerated: boolean;
  aiPrompt?: string;
}
```

#### PlanOperation Model
```typescript
interface PlanOperation {
  id: string;
  planId: string;
  sequence: number; // Orden de ejecución
  type: 'move' | 'copy' | 'rename' | 'delete' | 'mkdir' | 'archive';
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  source: {
    paths: string[];
    pattern?: string; // Para operaciones con wildcards
  };
  destination: {
    path: string;
    createIfNotExists: boolean;
    renamePattern?: string; // Para renombrado masivo
  };
  options: {
    overwriteExisting?: boolean;
    preserveAttributes?: boolean;
    followSymlinks?: boolean;
  };
  result?: {
    processedFiles: number;
    failedFiles: number;
    duration: number;
    errors?: string[];
  };
}
```

#### OrganizationRule Model
```typescript
interface OrganizationRule {
  id: string;
  userId: string;
  name: string;
  enabled: boolean;
  priority: number;
  condition: {
    type: 'extension' | 'name_pattern' | 'date_range' | 'size_range' | 'mime_type' | 'folder_depth';
    operator: 'equals' | 'contains' | 'matches' | 'greater_than' | 'less_than' | 'between';
    value: any;
    caseSensitive?: boolean;
  };
  action: {
    type: 'move' | 'copy' | 'rename' | 'tag' | 'archive';
    destination?: string; // Puede incluir variables como {year}, {month}, {extension}
    pattern?: string; // Para renombrado
    archiveFormat?: 'zip' | '7z' | 'tar.gz';
  };
  scope: {
    paths: string[];
    recursive: boolean;
    includeHidden: boolean;
  };
  statistics?: {
    lastApplied: Date;
    filesProcessed: number;
    timesApplied: number;
  };
}
```

#### OrganizationExecution Model
```typescript
interface OrganizationExecution {
  id: string;
  planId: string;
  startedAt: Date;
  completedAt?: Date;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  progress: {
    currentOperation: number;
    totalOperations: number;
    currentFile?: string;
    percentage: number;
  };
  rollbackAvailable: boolean;
  rollbackData?: {
    operations: RollbackOperation[];
    expiresAt: Date;
  };
  summary?: {
    filesMoved: number;
    filesRenamed: number;
    filesDeleted: number;
    spaceSaved: bigint;
    errors: ExecutionError[];
  };
}
```

## 4. Puntos de Integración con la Arquitectura Modular

### Integración con Módulos Core

#### organization-engine
- Motor de reglas de organización
- Aplicación de patrones
- Validación de operaciones

#### file-mover
- Movimiento atómico de archivos
- Gestión de colisiones
- Preservación de atributos

#### ai-organizer
- Interpretación de prompts
- Generación de planes
- Aprendizaje de patrones

#### rollback-manager
- Guardado de estado previo
- Reversión de operaciones
- Gestión de puntos de restauración

### Eventos del Sistema
```typescript
// Eventos a emitir
'organize:plan:created'
'organize:execution:started'
'organize:operation:completed'
'organize:execution:completed'
'organize:error'
'organize:rollback:available'
```

### Integración con FileExplorer
```typescript
// Comunicación bidireccional con FileExplorer
fileExplorer.on('selection:change', (items) => {
  organizeView.updateSourceFiles(items);
});

organizeView.on('destination:need', () => {
  fileExplorer.enterDestinationMode();
});
```

## 5. Identificación de Datos Reales vs Mock

### Datos Actualmente Mockeados

1. **organizationSuggestions** (línea 26-79)
   - 5 sugerencias hardcodeadas
   - Sin análisis real del sistema

2. **Conversación AI ejemplo**
   - Diálogo estático sobre Unreal Engine
   - Sin procesamiento real de prompts

3. **Tips del carousel**
   - 5 consejos predefinidos
   - Sin personalización

### Implementación de Datos Reales

```typescript
// Hook para análisis de organización
const {
  suggestions,
  loading,
  analyze
} = useOrganizationAnalysis({
  paths: selectedPaths,
  autoAnalyze: true
});

// Hook para ejecución del plan
const {
  execute,
  progress,
  cancel,
  rollback
} = useOrganizationExecution();

// Sistema de AI real
const generateAIPlan = async (prompt: string) => {
  const response = await api.generateOrganizationPlan({
    prompt,
    context: {
      currentPath,
      selectedFiles,
      userPreferences
    }
  });
  
  return response.plan;
};
```

## 6. Funcionalidades Adicionales Identificadas

### Organización Avanzada
1. **Templates predefinidos**:
   - Organizar fotos por fecha
   - Proyectos por tipo
   - Documentos por categoría

2. **Organización inteligente**:
   - Detección de proyectos
   - Agrupación por similitud
   - Limpieza de nombres

3. **Batch operations**:
   - Renombrado masivo
   - Aplicar estructura a múltiples carpetas
   - Sincronización de estructuras

### Visualización y Preview
1. **Vista antes/después**:
   - Árbol visual de cambios
   - Diff de estructura
   - Preview animado

2. **Simulación de cambios**:
   - Dry run visual
   - Validación de espacio
   - Detección de conflictos

3. **Historial de organizaciones**:
   - Planes anteriores
   - Posibilidad de re-aplicar
   - Estadísticas de uso

### Automatización
1. **Organización programada**:
   - Ejecutar en horarios específicos
   - Monitoreo de carpetas
   - Triggers por eventos

2. **Watchers de carpetas**:
   - Auto-organizar descargas
   - Clasificar nuevos archivos
   - Alertas de desorganización

## 7. Algoritmos de Organización

### Detección de Patrones
```typescript
// Análisis de estructura actual
const analyzeFolder = async (path: string): Promise<FolderAnalysis> => {
  const files = await scanFolder(path);
  
  return {
    // Detección de tipos predominantes
    mainType: detectPredominantType(files),
    
    // Patrones de nombrado
    namingPatterns: extractNamingPatterns(files),
    
    // Estructura temporal
    dateDistribution: analyzeDateDistribution(files),
    
    // Sugerencias basadas en análisis
    suggestions: generateSuggestions(files)
  };
};
```

### Motor de Reglas
```typescript
// Aplicación de reglas
const applyRule = (file: FileInfo, rule: OrganizationRule): Operation | null => {
  if (!evaluateCondition(file, rule.condition)) {
    return null;
  }
  
  const destination = resolveDestination(file, rule.action.destination);
  
  return {
    type: rule.action.type,
    source: file.path,
    destination,
    options: rule.action.options
  };
};
```

### Resolución de Conflictos
```typescript
// Estrategias de resolución
enum ConflictStrategy {
  SKIP = 'skip',
  OVERWRITE = 'overwrite',
  RENAME = 'rename',
  MERGE = 'merge', // Para carpetas
  ASK = 'ask'
}

const resolveConflict = (
  source: string, 
  destination: string, 
  strategy: ConflictStrategy
): Resolution => {
  switch (strategy) {
    case ConflictStrategy.RENAME:
      return {
        action: 'rename',
        newName: generateUniqueName(destination)
      };
    // ... más casos
  }
};
```

## 8. Tareas de Implementación Prioritarias

### Alta Prioridad
1. Integración real con FileExplorer
2. Sistema básico de move/copy funcional
3. Preview de operaciones antes de ejecutar
4. Validación de permisos y espacio

### Media Prioridad
1. Motor de reglas configurable
2. AI integration para sugerencias
3. Sistema de rollback
4. Progreso en tiempo real

### Baja Prioridad
1. Templates avanzados
2. Automatización y watchers
3. Visualización antes/después
4. Historial y estadísticas

## 9. Consideraciones de Rendimiento

### Operaciones en Lote
1. **Chunking de operaciones**:
   - Procesar en lotes de 100 archivos
   - Commit parcial para recuperación
   - Gestión de memoria

2. **Paralelización**:
   - Operaciones independientes en paralelo
   - Thread pool para I/O
   - Límites de concurrencia

### Optimización de UI
1. **Preview diferido**:
   - Calcular solo lo visible
   - Cache de estructuras
   - Virtualización de árboles grandes

2. **Actualizaciones incrementales**:
   - WebSocket para progreso
   - Batch UI updates
   - Debounce para cambios rápidos

## 10. Seguridad y Validaciones

### Validaciones Pre-ejecución
```typescript
const validatePlan = async (plan: OrganizationPlan): Promise<ValidationResult> => {
  const errors = [];
  const warnings = [];
  
  // Verificar permisos
  for (const op of plan.operations) {
    if (!await hasPermission(op.source, 'read')) {
      errors.push(`Sin permisos de lectura: ${op.source}`);
    }
    if (!await hasPermission(op.destination, 'write')) {
      errors.push(`Sin permisos de escritura: ${op.destination}`);
    }
  }
  
  // Verificar espacio
  const requiredSpace = calculateRequiredSpace(plan);
  const availableSpace = await getAvailableSpace(plan.destination);
  
  if (requiredSpace > availableSpace) {
    errors.push('Espacio insuficiente');
  }
  
  // Detectar operaciones peligrosas
  if (plan.operations.some(op => isSystemPath(op.source))) {
    warnings.push('Operaciones en carpetas del sistema');
  }
  
  return { errors, warnings, valid: errors.length === 0 };
};
```

### Transacciones y Atomicidad
1. **Operaciones atómicas**:
   - Todo o nada por operación
   - Puntos de checkpoint
   - Recovery ante fallos

2. **Journaling**:
   - Log de todas las operaciones
   - Estado antes/después
   - Capacidad de audit

## 11. UX Avanzado

### Feedback Visual
1. **Animaciones de movimiento**:
   - Visualizar archivos moviéndose
   - Indicadores de progreso por archivo
   - Efectos de completado

2. **Códigos de color**:
   - Verde: Operaciones seguras
   - Amarillo: Requieren atención
   - Rojo: Operaciones peligrosas

3. **Preview interactivo**:
   - Hover para ver detalles
   - Click para excluir/incluir
   - Drag & drop para ajustar

### Asistencia Contextual
1. **Sugerencias inteligentes**:
   - Basadas en comportamiento
   - Aprendizaje de patrones
   - Tips personalizados

2. **Validación en tiempo real**:
   - Mientras el usuario configura
   - Alertas inmediatas
   - Sugerencias de corrección