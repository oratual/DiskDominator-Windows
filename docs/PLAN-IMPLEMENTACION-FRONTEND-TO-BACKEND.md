# 🎯 PLAN MAESTRO: Frontend Mock → Backend Real

## 📊 ANÁLISIS COMPLETO DE FUNCIONALIDADES POR SECCIÓN

### 🏠 **1. HOME VIEW - Panel de Control**

#### **Componentes UI Identificados:**
- **Banner de Bienvenida**: Información introductoria
- **Quick Actions Grid (4 acciones)**: 
  - Escanear Disco Rápido
  - Buscar Duplicados  
  - Encontrar Archivos Grandes
  - Organizar Disco
- **Estado de los Discos**: 
  - Lista de discos con letra (C:, D:, etc.)
  - Barra de uso visual con colores (verde/amarillo/rojo)
  - Espacios: usado, total, libre
  - Totales del sistema
- **Actividad Reciente**: 
  - Log cronológico de operaciones
  - Icons por tipo de actividad
  - Timestamps formateados
  - Acciones: escaneos, duplicados encontrados, organización

#### **Datos Mock que Requieren Backend Real:**
```typescript
interface SystemOverview {
  disks: Array<{
    id: string,           // "C:", "D:", etc.
    used: number,         // bytes usados
    total: number,        // bytes totales  
    free: number,         // bytes libres
    filesystem: string    // "NTFS", "FAT32", etc.
  }>,
  total_disk_space: number,
  total_used_space: number, 
  total_free_space: number
}

interface RecentActivity {
  id: string,
  activity_type: string,    // "scan_completed", "duplicates_found", etc.
  action: string,          // "Escaneo completado", etc.
  target: string,          // "Disco C:", etc.
  time: string            // ISO timestamp
}
```

#### **Backend Requerido:**
- `get_system_overview()` → SystemOverview
- `get_recent_activity()` → RecentActivity[]
- `execute_quick_action(action_id)` → Boolean

---

### 🔍 **2. DISK STATUS VIEW - Analizador**

#### **Componentes UI Identificados:**
- **Selector de Discos**: Cards individuales por disco con estado
- **Barras de Progreso Duales**:
  - Quick Scan Progress (azul claro)
  - Deep Scan Progress (azul oscuro)
  - Progress general combinado
- **Controles de Escaneo**: Pausar/Reanudar/Cancelar por disco
- **Configuración de Exclusiones**: 
  - Input de patrones (node_modules, .git, etc.)
  - Explorador visual de carpetas
- **Mensajes de Estado**: Información en tiempo real
- **Panel de Información**: Consejos y estadísticas

#### **Estados de Disco Complejos:**
```typescript
interface DiskStatus {
  id: string,
  name: string,
  status: "scanning" | "pending" | "complete" | "error" | "paused",
  scanType: "quick" | "slow" | null,
  progress: number,                    // 0-100
  quickScanProgress: number,           // 0-100 
  slowScanProgress: number,            // 0-100
  canAnalyzeDuplicates: boolean,       // true after quick scan
  canOrganize: boolean,                // true after deep scan
  estimatedTimeRemaining: number,     // seconds
  currentPath: string,                 // path being scanned
  filesScanned: number,
  totalFiles: number,
  isPaused: boolean
}
```

#### **Backend Requerido:**
- `scan_disk(disk_id, scan_type, exclude_patterns)` → session_id
- `get_scan_progress(session_id)` → DiskStatus
- `pause_scan(session_id)` → Boolean
- `resume_scan(session_id)` → Boolean
- `cancel_scan(session_id)` → Boolean
- **WebSocket**: Real-time progress updates cada 100 archivos

---

### 👥 **3. DUPLICATES VIEW - Duplicados**

#### **Componentes UI Identificados:**
- **DiskSelector**: Filtrar por discos específicos
- **Configuración de Detección**:
  - Método: hash, name, size, name_and_size
  - Tipos de archivo: todos, imágenes, videos, documentos
  - Estrategia: conservar más reciente, más antiguo, manual
- **Lista de Grupos de Duplicados**:
  - Vista expandible por grupo
  - Selección inteligente automática (verde=conservar, rojo=eliminar)
  - Metadatos: tamaño, fecha, ubicación
- **Operaciones Batch**:
  - Eliminación múltiple con confirmación
  - Vista previa de archivos
  - Abrir ubicación en explorador
- **Estadísticas**: Espacio recuperable, total de duplicados

#### **Datos Complejos:**
```typescript
interface DuplicateGroup {
  id: string,
  hash: string,
  name: string,
  file_type: string,
  total_size: number,
  recoverable_size: number,
  copies: Array<{
    id: string,
    path: string,
    size: number,
    created: number,
    modified: number,
    is_original: boolean,
    keep_suggestion: boolean,
    metadata?: { width?, height?, duration? }
  }>
}
```

#### **Backend Requerido:**
- `find_duplicates(options)` → DuplicateGroup[]
- `smart_select_duplicates(strategy)` → selections  
- `delete_duplicates_batch(file_ids, move_to_trash)` → result
- `preview_duplicate(file_path)` → file_content/metadata

---

### 🗂️ **4. BIG FILES VIEW - Archivos Grandes**

#### **Componentes UI Identificados:**
- **FileSizeSlider**: Control dual min/max con escala logarítmica
- **FileListView**: Tabla con ordenamiento avanzado
- **FileExplorerView**: Vista jerárquica de carpetas
- **StorageStats**: Gráficos de distribución por tipo/tamaño
- **Operaciones**:
  - Compresión individual con opciones de formato
  - Eliminación batch con confirmación
  - Vista previa de archivos
  - Análisis de potencial de compresión

#### **Datos Específicos:**
```typescript
interface LargeFileInfo {
  id: string,
  path: string,
  name: string,
  size: number,
  file_type: string,
  extension: string,
  created: number,
  modified: number,
  disk: string,
  compression_potential: number,    // 0.0-1.0
  last_opened?: number
}

interface SpaceAnalysis {
  total_size: number,
  file_count: number,
  by_type: Record<string, {size: number, count: number, percentage: number}>,
  size_distribution: {tiny: number, small: number, medium: number, large: number}
}
```

#### **Backend Requerido:**
- `find_large_files(filter)` → LargeFileInfo[]
- `get_file_space_analysis(paths)` → SpaceAnalysis
- `compress_file(file_path, options)` → CompressionResult
- `delete_large_files_batch(file_ids, move_to_trash)` → BatchDeleteResult
- `generate_file_preview(file_path)` → preview_data

---

### 🗂️ **5. ORGANIZE VIEW - Organización**

#### **Componentes UI Identificados:**
- **Multi-Panel Explorer**: 4 modos de vista (single/horizontal/vertical/grid)
- **AI Suggestions Panel**: Sugerencias con confianza y razones
- **Plan Creation & Execution**:
  - Vista previa de cambios
  - Simulación (dry-run) 
  - Ejecución real con progress
  - Rollback capability
- **File Operations**: Drag & drop, selección múltiple, batch operations

#### **Datos Avanzados:**
```typescript
interface OrganizationSuggestion {
  id: string,
  suggestion_type: "move" | "rename" | "group" | "delete" | "archive",
  title: string,
  description: string,
  from_paths: string[],
  to_path: string,
  affected_files: FileInfo[],
  estimated_time: number,
  confidence: number,         // 0.0-1.0
  reason: string
}

interface OrganizationPlan {
  id: string,
  name: string,
  status: "draft" | "ready" | "executing" | "completed" | "failed",
  operations: PlanOperation[],
  estimated_time: number,
  rollback_available: boolean
}
```

#### **Backend Requerido:**
- `analyze_directory_structure(path)` → DirectoryStructure
- `get_organization_suggestions(paths)` → OrganizationAnalysis
- `create_organization_plan(options)` → plan_id
- `execute_organization_plan(plan_id, dry_run)` → ExecutionResult
- `rollback_organization(plan_id)` → Boolean

---

## 🔄 **DEPENDENCIAS ENTRE SECCIONES**

### **Orden de Dependencias:**
```
1. HOME VIEW (independiente, dashboard central)
   ↓
2. DISK STATUS (prerequisito para todo lo demás)
   ↓
3. DUPLICATES + BIG FILES (requieren escaneo previo, paralelas)
   ↓  
4. ORGANIZE (requiere datos de todas las anteriores)
```

### **Componentes Reutilizables Identificados:**
- **DiskSelector**: Usado en Home, DiskStatus, Duplicates, BigFiles
- **ProgressBars**: Usado en DiskStatus, Organize (execution)
- **FilePreview**: Usado en Duplicates, BigFiles, Organize  
- **BatchOperations**: Usado en Duplicates, BigFiles, Organize
- **AIAssistant**: Usado en todas las vistas
- **FileExplorer**: Usado en BigFiles, Organize

---

## 🚀 **PLAN DE IMPLEMENTACIÓN ÓPTIMO**

### **FASE 1: Fundación (1-2 semanas)**
1. **Sistema de Discos Base**
   - Implementar `get_system_overview()` para leer discos Windows reales
   - Detección de filesystem (NTFS/FAT32)
   - Cálculos de espacio usado/libre/total
   
2. **Logging de Actividad**
   - Sistema básico de audit log
   - `get_recent_activity()` con timestamps reales

### **FASE 2: Escaneo Core (2-3 semanas)**
1. **Sistema de Sesiones de Escaneo**
   - UUIDs, estado persistente, pause/resume
   - WebSocket manager para updates en tiempo real
   
2. **Quick Scan con MFT**
   - Implementación real de acceso MFT
   - DeviceIoControl y FSCTL commands
   - Progress tracking cada 100 archivos

3. **Deep Scan con Hashing**  
   - SHA-256 hashing para archivos grandes
   - Parallel processing con Rayon

### **FASE 3: Funcionalidades Paralelas (3-4 semanas)**
1. **Detección de Duplicados** (Backend)
   - Algoritmos por hash, name, size
   - Smart selection strategies
   
2. **Análisis de Archivos Grandes** (Backend)
   - Filtrado avanzado por tamaño
   - Análisis de espacio por categorías
   - Sistema de compresión básico

### **FASE 4: Organización Avanzada (2-3 semanas)**
1. **Motor de Reglas de Organización**
   - Rule engine con conditions/actions
   - Simulación y rollback
   - Batch operations seguras

### **FASE 5: Integración y Pulimiento (1-2 semanas)**
1. **Migración Mock→Real por sección**
2. **Testing end-to-end**
3. **Optimizaciones de performance**

---

## 💡 **OPTIMIZACIONES IDENTIFICADAS**

### **Modularización para Suite:**
- **Core FileSystem Module**: Operaciones básicas de archivos
- **Disk Analysis Module**: Escaneo y análisis (reutilizable en otros productos)
- **Progress Tracking Module**: Sistema de WebSocket y progress
- **AI Integration Module**: Base para chat assistants
- **Audit Log Module**: Sistema de logging de actividades

### **Performance Optimizations:**
- **Shared Scan Results**: Un escaneo alimenta todas las vistas
- **Incremental Updates**: USN Journal para cambios en tiempo real
- **Lazy Loading**: Componentes UI cargados bajo demanda
- **Caching Strategy**: Cache de metadatos entre sesiones

### **Code Reuse Opportunities:**
- **Common File Operations**: move/copy/delete/rename
- **Progress UI Components**: Barras de progreso reutilizables
- **File Type Detection**: MIME type analysis compartido
- **Size Formatting**: Utilities para formatear bytes

---

## 🎯 **PRÓXIMOS PASOS INMEDIATOS**

1. **Comenzar con FASE 1**: Implementar `get_system_overview()` real
2. **Setup Cargo workspace**: Para módulos reutilizables
3. **Definir interfaces estables**: Entre frontend y backend
4. **Crear sistema de testing**: Para validar migración mock→real

Este plan asegura:
- ✅ **Progreso visible inmediato** (discos reales en home)
- ✅ **Base sólida** para funcionalidades complejas  
- ✅ **Reutilización máxima** para suite de productos
- ✅ **Testing incremental** para validar cada fase