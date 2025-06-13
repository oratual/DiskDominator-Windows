# Análisis de HomeView - Panel de Control

## 1. Elementos UI Actuales y su Propósito

### Welcome Banner
- **Propósito**: Introducir al usuario a la aplicación
- **Contenido**: Título de bienvenida y descripción de las capacidades principales
- **Estado**: Estático, informativo

### Quick Actions (Acciones Rápidas)
- **Analizar Discos**: Tarjeta con icono RefreshCw, descripción del proceso de escaneo
- **Propósito**: Acceso rápido a las funciones principales
- **Estado**: Actualmente solo muestra una tarjeta, faltan las otras 3

### Estado de los Discos
- **Propósito**: Visualización en tiempo real del espacio utilizado
- **Elementos**:
  - Lista de 4 discos (C, D, E, J) con datos mockeados
  - Barras de progreso con colores diferenciados
  - Información de espacio usado/total/libre
  - Botón "Ver detalles completos"

### Actividad Reciente
- **Propósito**: Registro cronológico de operaciones
- **Elementos**:
  - Lista de actividades con iconos, descripción y tiempo
  - Botón "Ver todo el historial"
- **Estado**: Datos mockeados

### AI Assistant Integration
- **Propósito**: Ayuda contextual al usuario
- **Estado**: Mensajes de bienvenida inicializados

## 2. Funciones que Necesitan Implementación en el Backend

### API Endpoints Necesarios

#### Información de Discos
```typescript
GET /api/disks
Response: {
  disks: [{
    id: string,
    label: string,
    path: string,
    used: number,
    total: number,
    free: number,
    lastScanned: Date | null
  }]
}
```

#### Actividad Reciente
```typescript
GET /api/activity/recent
Response: {
  activities: [{
    id: string,
    action: string,
    target: string,
    time: Date,
    type: 'scan' | 'duplicate' | 'delete' | 'move' | 'organize',
    status: 'success' | 'error' | 'warning'
  }]
}
```

#### Estadísticas Generales
```typescript
GET /api/stats/summary
Response: {
  totalDiskSpace: number,
  totalUsedSpace: number,
  totalFreeSpace: number,
  duplicatesFound: number,
  spaceRecoverable: number,
  largeFilesCount: number,
  lastFullScan: Date | null
}
```

#### Quick Actions Status
```typescript
GET /api/quick-actions/status
Response: {
  actions: [{
    id: string,
    title: string,
    description: string,
    enabled: boolean,
    requiresScan: boolean,
    lastExecuted: Date | null
  }]
}
```

## 3. Estructuras de Datos Requeridas

### Modelos de Base de Datos

#### Disk Model
```typescript
interface Disk {
  id: string;
  systemPath: string; // C:\, D:\, etc.
  label: string;
  fileSystem: string; // NTFS, FAT32, etc.
  totalSpace: bigint;
  usedSpace: bigint;
  freeSpace: bigint;
  lastUpdated: Date;
  isSystemDisk: boolean;
  isRemovable: boolean;
}
```

#### Activity Model
```typescript
interface Activity {
  id: string;
  userId: string;
  timestamp: Date;
  action: ActivityAction;
  target: string;
  targetType: 'file' | 'folder' | 'disk';
  metadata: {
    size?: number;
    count?: number;
    duration?: number;
    error?: string;
  };
  status: 'success' | 'error' | 'warning' | 'in_progress';
}

enum ActivityAction {
  SCAN_STARTED = 'scan_started',
  SCAN_COMPLETED = 'scan_completed',
  DUPLICATES_FOUND = 'duplicates_found',
  FILES_DELETED = 'files_deleted',
  FILES_MOVED = 'files_moved',
  DISK_ORGANIZED = 'disk_organized',
  ERROR_OCCURRED = 'error_occurred'
}
```

## 4. Puntos de Integración con la Arquitectura Modular

### Integración con Módulos Core

#### disk-scanner
- Obtener información actualizada de los discos
- Iniciar escaneos desde quick actions
- Actualizar estado de discos en tiempo real

#### activity-logger
- Registrar todas las acciones del usuario
- Mantener historial de operaciones
- Proveer datos para "Actividad Reciente"

#### stats-aggregator
- Calcular estadísticas generales del sistema
- Proveer métricas para dashboard
- Actualizar contadores en tiempo real

### Eventos del Sistema
```typescript
// Eventos a escuchar
'disk:scan:started'
'disk:scan:progress'
'disk:scan:completed'
'activity:new'
'stats:updated'
```

## 5. Identificación de Datos Reales vs Mock

### Datos Actualmente Mockeados

1. **diskStats** (línea 45-50)
   - Reemplazar con llamada a `/api/disks`
   - Actualizar en tiempo real con WebSocket

2. **recentActivity** (línea 27-43)
   - Reemplazar con llamada a `/api/activity/recent`
   - Implementar auto-refresh cada 30 segundos

3. **Quick Actions**
   - Completar las 4 tarjetas faltantes
   - Conectar con acciones reales del sistema

### Implementación de Datos Reales

```typescript
// Hook para datos de discos
const { data: disks, loading, error } = useDiskStats();

// Hook para actividad reciente
const { data: activities, refetch } = useRecentActivity({
  limit: 5,
  autoRefresh: 30000
});

// Hook para estadísticas
const { data: stats } = useSystemStats();
```

## 6. Funcionalidades Adicionales Identificadas

### Quick Actions Faltantes
1. **Encontrar Duplicados**
   - Navegación directa a vista de duplicados
   - Mostrar cantidad de duplicados encontrados

2. **Archivos Gigantes**
   - Navegación a vista de archivos grandes
   - Mostrar cantidad de archivos > 1GB

3. **Organizar Disco**
   - Navegación a vista de organización
   - Estado: habilitado/deshabilitado según escaneo

### Mejoras de UX
1. **Auto-refresh de datos**
   - WebSocket para actualizaciones en tiempo real
   - Indicadores de carga y error

2. **Tooltips informativos**
   - Explicar qué hace cada acción
   - Mostrar requisitos (ej: "Requiere escaneo completo")

3. **Acciones contextuales**
   - Click en disco → ir a detalles
   - Click en actividad → ver detalles/logs

## 7. Tareas de Implementación Prioritarias

### Alta Prioridad
1. Implementar endpoint `/api/disks` con datos reales del sistema
2. Completar las 4 tarjetas de Quick Actions
3. Conectar vista con datos reales de discos

### Media Prioridad
1. Implementar sistema de actividades/logs
2. Agregar WebSocket para actualizaciones en tiempo real
3. Implementar navegación desde quick actions

### Baja Prioridad
1. Animaciones y transiciones
2. Tooltips y ayudas contextuales
3. Personalización del dashboard

## 8. Consideraciones de Rendimiento

1. **Caché de datos de disco**: Actualizar cada 5 segundos máximo
2. **Paginación de actividades**: Cargar solo las 5 más recientes inicialmente
3. **Lazy loading**: Cargar detalles completos solo cuando se soliciten
4. **Debounce**: Para actualizaciones frecuentes de UI