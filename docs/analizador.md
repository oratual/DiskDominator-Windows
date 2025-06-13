# Análisis de DiskStatusView - Analizador de Discos

## 1. Elementos UI Actuales y su Propósito

### DiskStatusMessage (Mensaje de Estado)
- **Propósito**: Informar al usuario sobre el estado actual del análisis
- **Estados**:
  - Sin escanear: "Espera a que los discos se escaneen"
  - Parcialmente escaneado: Lista discos con escaneo rápido completo
  - Todo escaneado rápido: Habilita Duplicados y Archivos Gigantes
  - Todo completo: Todas las funciones disponibles
- **Animaciones**: Bordes animados según tipo de escaneo (construcción)

### Panel de Información (Tipos de Escaneo)
- **Escaneo Rápido**:
  - Icono: Zap (rayo)
  - Color: Verde
  - Habilita: Duplicados y Archivos Gigantes
  - Duración: Minutos
  
- **Escaneo Completo**:
  - Icono: HardDrive
  - Color: Púrpura
  - Habilita: Ordenar Disco
  - Duración: Horas

### Panel de Privacidad
- **Omitir del escaneo**:
  - Botón "Configurar" → Modal de exclusión
  - Información sobre metadata vs contenido
  - Tooltip explicativo sobre metadata

### Tarjetas de Disco
- **Información mostrada**:
  - Nombre del disco
  - Estado (scanning, complete, error, paused, pending)
  - Tipo de escaneo actual
  - Progreso dual (escaneo rápido y completo)
  - Espacio usado/total/libre
  - Estados habilitados (Duplicados, Organizar)
  - Tiempo restante estimado

- **Acciones**:
  - Escanear (desde pending/error)
  - Pausar/Reanudar (durante escaneo)
  - Volver a escanear (cuando complete)

### Modal de Exclusión
- **FileExplorer** con checkboxes
- Selección de discos y carpetas
- Botones Guardar/Cancelar

### AI Assistant Panel
- **Chat colapsable/expandible**
- Mensajes de bienvenida contextuales
- Input para preguntas del usuario
- Sugerencias de preguntas

## 2. Funciones que Necesitan Implementación en el Backend

### API Endpoints Necesarios

#### Obtener Estado de Discos
```typescript
GET /api/disks/scan-status
Response: {
  disks: [{
    id: string,
    name: string,
    path: string,
    status: 'scanning' | 'complete' | 'error' | 'paused' | 'pending',
    scanType: 'quick' | 'slow' | null,
    quickScanProgress: number,
    slowScanProgress: number,
    canAnalyzeDuplicates: boolean,
    canOrganize: boolean,
    estimatedTimeRemaining: number,
    size: string,
    used: string,
    free: string,
    isPaused: boolean,
    error?: string
  }]
}
```

#### Iniciar Escaneo
```typescript
POST /api/disks/{diskId}/scan
Body: {
  scanType: 'quick' | 'slow',
  excludePaths?: string[]
}
Response: {
  scanId: string,
  status: 'started',
  estimatedDuration: number
}
```

#### Pausar/Reanudar Escaneo
```typescript
PUT /api/scans/{scanId}/pause
PUT /api/scans/{scanId}/resume
Response: {
  status: 'paused' | 'resumed',
  remainingTime: number
}
```

#### Configurar Exclusiones
```typescript
GET /api/scan-config/exclusions
Response: {
  excludedPaths: string[]
}

PUT /api/scan-config/exclusions
Body: {
  paths: string[]
}
```

#### WebSocket para Progreso en Tiempo Real
```typescript
WS /api/scans/progress
Messages: {
  type: 'progress',
  diskId: string,
  scanType: 'quick' | 'slow',
  progress: number,
  remainingTime: number,
  filesScanned: number,
  totalFiles: number
}
```

## 3. Estructuras de Datos Requeridas

### Modelos de Base de Datos

#### ScanSession Model
```typescript
interface ScanSession {
  id: string;
  diskId: string;
  userId: string;
  type: 'quick' | 'slow';
  status: 'pending' | 'running' | 'paused' | 'completed' | 'error';
  startedAt: Date;
  completedAt?: Date;
  pausedAt?: Date;
  progress: number;
  filesScanned: number;
  totalFiles: number;
  bytesScanned: bigint;
  totalBytes: bigint;
  error?: string;
  results?: {
    duplicatesFound?: number;
    largeFilesFound?: number;
    organizationSuggestions?: number;
  };
}
```

#### ScanConfiguration Model
```typescript
interface ScanConfiguration {
  id: string;
  userId: string;
  excludedPaths: string[];
  excludedExtensions: string[];
  minFileSize?: number;
  maxFileSize?: number;
  scanHiddenFiles: boolean;
  scanSystemFiles: boolean;
  followSymlinks: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

#### DiskScanResult Model
```typescript
interface DiskScanResult {
  id: string;
  sessionId: string;
  diskId: string;
  scanType: 'quick' | 'slow';
  fileIndex: FileIndexEntry[];
  duplicateGroups: DuplicateGroup[];
  largeFiles: LargeFile[];
  folderStats: FolderStatistics[];
  completedAt: Date;
}
```

## 4. Puntos de Integración con la Arquitectura Modular

### Integración con Módulos Core

#### file-scanner
- Motor principal de escaneo
- Gestión de hilos de escaneo
- Cálculo de hashes para duplicados
- Indexación de archivos

#### progress-tracker
- Seguimiento de progreso en tiempo real
- Estimación de tiempo restante
- Gestión de pausas/reanudaciones

#### exclusion-manager
- Gestión de rutas excluidas
- Aplicación de filtros durante escaneo
- Persistencia de configuración

### Eventos del Sistema
```typescript
// Eventos emitidos
'scan:started'
'scan:progress'
'scan:paused'
'scan:resumed'
'scan:completed'
'scan:error'
'scan:file:processed'
'scan:duplicate:found'
```

### Comunicación entre Módulos
```typescript
// Scanner → UI
scannerModule.on('progress', (data) => {
  websocket.emit('scan:progress', data);
});

// UI → Scanner
ipcMain.handle('scan:start', async (event, options) => {
  return await scannerModule.startScan(options);
});
```

## 5. Identificación de Datos Reales vs Mock

### Datos Actualmente Mockeados

1. **Estado inicial de discos** (línea 279-380)
   - 7 discos con estados variados
   - Reemplazar con detección real del sistema

2. **Simulación de progreso** (línea 442-519)
   - useEffect con setInterval
   - Reemplazar con eventos reales del scanner

3. **Tiempos estimados**
   - Quick scan: 120 segundos hardcodeado
   - Slow scan: 300 segundos hardcodeado

### Implementación de Datos Reales

```typescript
// Hook para estado de discos
const { disks, refetch } = useDisksStatus({
  includeNetworkDrives: true,
  includeRemovable: true
});

// WebSocket para progreso
const { progress, timeRemaining } = useScanProgress(scanId);

// Detección de discos del sistema
const detectSystemDisks = async () => {
  const disks = await window.electron.getDisks();
  return disks.map(disk => ({
    id: disk.letter,
    name: `${disk.label} (${disk.letter}:)`,
    path: `${disk.letter}:\\`,
    size: formatBytes(disk.total),
    used: formatBytes(disk.used),
    free: formatBytes(disk.free)
  }));
};
```

## 6. Funcionalidades Adicionales Identificadas

### Mejoras de Escaneo
1. **Escaneo por lotes**
   - Seleccionar múltiples discos
   - Escanear todos simultáneamente

2. **Perfiles de escaneo**
   - Guardar configuraciones
   - Escaneo rápido personalizado

3. **Programación de escaneos**
   - Escaneos automáticos
   - Notificaciones de resultados

### Mejoras de UI/UX
1. **Vista detallada de progreso**
   - Archivo actual siendo escaneado
   - Velocidad de escaneo (archivos/seg)
   - Gráfico de progreso

2. **Historial de escaneos**
   - Resultados anteriores
   - Comparación entre escaneos

3. **Exportar resultados**
   - Generar reportes
   - Exportar lista de archivos

### Integraciones
1. **Notificaciones del sistema**
   - Escaneo completado
   - Errores encontrados

2. **Integración con Windows Defender**
   - Excluir archivos en cuarentena
   - Respetar exclusiones del antivirus

## 7. Algoritmos de Escaneo Necesarios

### Escaneo Rápido
```typescript
// Pseudocódigo
1. Enumerar estructura de directorios
2. Obtener metadata básica (tamaño, fecha)
3. Calcular hash rápido para archivos > 1MB
4. Identificar duplicados por tamaño + hash parcial
5. Marcar archivos grandes
```

### Escaneo Completo
```typescript
// Pseudocódigo
1. Todo lo del escaneo rápido
2. Calcular hash completo SHA-256
3. Análisis profundo de contenido
4. Detección de patrones de organización
5. Análisis de tipos de archivo
6. Construcción de árbol de carpetas
```

## 8. Tareas de Implementación Prioritarias

### Alta Prioridad
1. Implementar detección real de discos del sistema
2. Motor de escaneo básico con progreso real
3. WebSocket para actualizaciones en tiempo real
4. Sistema de pausar/reanudar funcional

### Media Prioridad
1. Gestión de exclusiones con persistencia
2. Cálculo de hashes para detección de duplicados
3. Estimación precisa de tiempo restante
4. Manejo robusto de errores

### Baja Prioridad
1. Animaciones y efectos visuales
2. Historial de escaneos
3. Perfiles de configuración
4. Exportación de resultados

## 9. Consideraciones de Rendimiento

### Optimizaciones de Escaneo
1. **Multi-threading**: Usar workers para escaneo paralelo
2. **Chunking**: Procesar archivos en lotes de 1000
3. **Caché de hashes**: Reutilizar hashes calculados
4. **Índice incremental**: Solo escanear cambios

### Optimizaciones de UI
1. **Virtual scrolling**: Para listas grandes de archivos
2. **Debounce**: Actualizar UI máximo 10 veces/segundo
3. **Progressive rendering**: Mostrar resultados conforme aparecen
4. **Memory management**: Liberar datos antiguos

## 10. Manejo de Errores

### Errores Comunes
1. **Acceso denegado**: Archivos del sistema
2. **Disco desconectado**: Durante escaneo
3. **Espacio insuficiente**: Para índice
4. **Corrupción de datos**: Archivos dañados

### Estrategias de Recuperación
1. **Skip y continuar**: Ignorar archivos problemáticos
2. **Retry automático**: Para errores temporales
3. **Guardado parcial**: Preservar progreso
4. **Logs detallados**: Para debugging