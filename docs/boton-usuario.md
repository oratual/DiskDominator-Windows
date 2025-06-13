# Análisis de UserMenu y UserProfileButton - Botón de Usuario

## 1. Elementos UI Actuales y su Propósito

### UserProfileButton
- **Avatar circular** con imagen o inicial
- **Imagen de perfil**: soccer-player-portrait.png
- **Fallback**: Primera letra del nombre en fondo azul
- **Estados**: hover, focus (ring azul)
- **Manejo de errores**: Si falla la imagen, muestra inicial

### UserMenu (Dropdown)
- **Trigger**: El UserProfileButton
- **Secciones del menú**:
  1. Header con nombre y email
  2. Opciones de perfil (Usuario, Créditos, Ajustes, Historial)
  3. Selector de tema (Claro, Oscuro, Sistema)
  4. Opciones de legibilidad (expandible)
  5. Cerrar sesión

### Opciones de Legibilidad
- **Tamaño del Texto**: Pequeño, Normal, Grande
- **Contraste**: Normal, Alto
- **Espaciado**: Normal, Amplio
- **Opciones Avanzadas** (expandible):
  - Filtros de color para daltonismo
  - Escala de grises
  - Protanopía, Deuteranopía, Tritanopía

### Estados y Comportamiento
- **Dropdown controlado** con estado interno
- **Click outside** para cerrar
- **Animaciones** en toggles y expansiones
- **Persistencia** de configuraciones en DOM

## 2. Funciones que Necesitan Implementación en el Backend

### API Endpoints Necesarios

#### Información de Usuario
```typescript
GET /api/user/profile
Response: {
  user: {
    id: string,
    name: string,
    email: string,
    avatarUrl?: string,
    credits: number,
    plan: 'free' | 'pro' | 'enterprise',
    preferences: UserPreferences,
    stats: {
      totalScans: number,
      spaceSaved: number,
      filesOrganized: number
    }
  }
}
```

#### Actualizar Preferencias
```typescript
PUT /api/user/preferences
Body: {
  theme?: 'light' | 'dark' | 'system',
  readability?: {
    textSize: 'small' | 'normal' | 'large',
    contrast: 'normal' | 'high',
    spacing: 'normal' | 'wide',
    colorFilter: 'none' | 'grayscale' | 'protanopia' | 'deuteranopia' | 'tritanopia'
  },
  language?: string,
  notifications?: NotificationSettings
}
Response: {
  preferences: UserPreferences,
  applied: boolean
}
```

#### Sistema de Créditos
```typescript
GET /api/user/credits
Response: {
  balance: number,
  history: [{
    id: string,
    type: 'earned' | 'spent' | 'purchased',
    amount: number,
    description: string,
    date: Date
  }],
  pending: number
}

POST /api/user/credits/purchase
Body: {
  amount: number,
  paymentMethod: string
}
```

#### Historial de Actividad
```typescript
GET /api/user/activity
Query: {
  limit?: number,
  offset?: number,
  type?: string
}
Response: {
  activities: [{
    id: string,
    type: string,
    description: string,
    timestamp: Date,
    metadata: object
  }],
  total: number
}
```

#### Gestión de Sesión
```typescript
POST /api/auth/logout
Response: {
  success: boolean,
  redirectUrl?: string
}

GET /api/auth/session
Response: {
  valid: boolean,
  expiresAt: Date,
  refreshToken?: string
}
```

## 3. Estructuras de Datos Requeridas

### Modelos de Base de Datos

#### User Model
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  avatarData?: Buffer; // Para avatares subidos
  plan: UserPlan;
  credits: number;
  createdAt: Date;
  lastLogin: Date;
  isActive: boolean;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
}

enum UserPlan {
  FREE = 'free',
  PRO = 'pro',
  ENTERPRISE = 'enterprise'
}
```

#### UserPreferences Model
```typescript
interface UserPreferences {
  id: string;
  userId: string;
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  readability: {
    textSize: 'small' | 'normal' | 'large';
    contrast: 'normal' | 'high';
    spacing: 'normal' | 'wide';
    colorFilter: ColorFilter;
    reduceMotion: boolean;
    highContrastMode: boolean;
  };
  notifications: {
    email: boolean;
    push: boolean;
    scanComplete: boolean;
    weeklyReport: boolean;
    tipsAndTricks: boolean;
  };
  privacy: {
    shareAnalytics: boolean;
    showProfilePublic: boolean;
  };
  updatedAt: Date;
}

enum ColorFilter {
  NONE = 'none',
  GRAYSCALE = 'grayscale',
  PROTANOPIA = 'protanopia',
  DEUTERANOPIA = 'deuteranopia',
  TRITANOPIA = 'tritanopia'
}
```

#### CreditTransaction Model
```typescript
interface CreditTransaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  balance: number; // Balance después de la transacción
  description: string;
  metadata?: {
    scanId?: string;
    operationType?: string;
    fileCount?: number;
  };
  createdAt: Date;
}

enum TransactionType {
  EARNED_SCAN = 'earned_scan',
  EARNED_REFERRAL = 'earned_referral',
  SPENT_OPERATION = 'spent_operation',
  PURCHASED = 'purchased',
  BONUS = 'bonus',
  REFUND = 'refund'
}
```

## 4. Puntos de Integración con la Arquitectura Modular

### Integración con Módulos Core

#### auth-manager
- Gestión de sesiones
- Tokens de autenticación
- Logout seguro

#### preferences-manager
- Persistencia de preferencias
- Sincronización entre dispositivos
- Aplicación de temas

#### credits-system
- Gestión de balance
- Historial de transacciones
- Cálculo de costos

#### accessibility-engine
- Aplicación de filtros de color
- Gestión de contraste
- Configuraciones de lectura

### Eventos del Sistema
```typescript
// Eventos a emitir
'user:preferences:updated'
'user:theme:changed'
'user:logout'
'user:credits:changed'
'user:accessibility:changed'
```

### Sincronización de Estado
```typescript
// Sincronizar preferencias entre pestañas
window.addEventListener('storage', (e) => {
  if (e.key === 'user_preferences') {
    applyPreferences(JSON.parse(e.newValue));
  }
});

// Broadcast de cambios
const broadcastPreferenceChange = (prefs: UserPreferences) => {
  localStorage.setItem('user_preferences', JSON.stringify(prefs));
  window.dispatchEvent(new CustomEvent('preferencesChanged', { detail: prefs }));
};
```

## 5. Identificación de Datos Reales vs Mock

### Datos Actualmente Mockeados

1. **Información de usuario**:
   - userName y userEmail pasados como props
   - Sin conexión con sistema de auth real

2. **Créditos**:
   - Número estático pasado como prop
   - Sin actualización dinámica

3. **Avatar**:
   - Imagen estática (soccer-player-portrait.png)
   - Sin sistema de upload

4. **Preferencias**:
   - Solo se aplican al DOM local
   - Sin persistencia en backend

### Implementación de Datos Reales

```typescript
// Hook para usuario actual
const { user, loading, error } = useCurrentUser();

// Hook para preferencias
const {
  preferences,
  updatePreference,
  resetPreferences
} = useUserPreferences();

// Sistema de créditos real
const {
  balance,
  transactions,
  purchaseCredits
} = useCreditsSystem();

// Gestión de avatar
const uploadAvatar = async (file: File) => {
  const formData = new FormData();
  formData.append('avatar', file);
  
  const response = await api.uploadAvatar(formData);
  return response.avatarUrl;
};
```

## 6. Funcionalidades Adicionales Identificadas

### Gestión de Perfil
1. **Edición de perfil**:
   - Cambiar nombre/email
   - Subir/cambiar avatar
   - Configurar privacidad

2. **Gestión de cuenta**:
   - Cambiar contraseña
   - 2FA configuración
   - Eliminar cuenta

3. **Planes y suscripción**:
   - Ver plan actual
   - Upgrade/downgrade
   - Historial de pagos

### Características Avanzadas
1. **Temas personalizados**:
   - Crear temas propios
   - Importar/exportar temas
   - Temas por horario

2. **Accesibilidad mejorada**:
   - Lector de pantalla optimizado
   - Navegación por teclado
   - Comandos de voz

3. **Sincronización**:
   - Entre dispositivos
   - Backup de preferencias
   - Perfiles múltiples

### Gamificación
1. **Sistema de logros**:
   - Badges por acciones
   - Niveles de usuario
   - Recompensas en créditos

2. **Estadísticas**:
   - Dashboard personal
   - Comparación con otros usuarios
   - Metas y objetivos

## 7. Sistema de Notificaciones

### Tipos de Notificaciones
```typescript
interface NotificationSettings {
  channels: {
    email: boolean;
    push: boolean;
    inApp: boolean;
  };
  types: {
    scanComplete: boolean;
    errorOccurred: boolean;
    creditLow: boolean;
    weeklyReport: boolean;
    systemUpdates: boolean;
    tips: boolean;
  };
  schedule: {
    quietHours: boolean;
    quietStart: string; // "22:00"
    quietEnd: string; // "08:00"
    timezone: string;
  };
}
```

### Centro de Notificaciones
```typescript
// En el UserMenu
<DropdownMenuItem>
  <Bell className="mr-2 h-4 w-4" />
  <span>Notificaciones</span>
  {unreadCount > 0 && (
    <Badge className="ml-auto">{unreadCount}</Badge>
  )}
</DropdownMenuItem>
```

## 8. Tareas de Implementación Prioritarias

### Alta Prioridad
1. Conectar con sistema de autenticación real
2. Persistir preferencias de tema/accesibilidad
3. Implementar logout funcional
4. Sistema básico de créditos

### Media Prioridad
1. Upload y gestión de avatar
2. Historial de actividad
3. Notificaciones básicas
4. Sincronización de preferencias

### Baja Prioridad
1. Temas personalizados
2. Gamificación
3. Comandos de voz
4. Perfiles múltiples

## 9. Consideraciones de Seguridad

### Autenticación y Autorización
```typescript
// Middleware de autenticación
const requireAuth = async (req: Request) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    throw new UnauthorizedError('No token provided');
  }
  
  const decoded = await verifyToken(token);
  const user = await getUserById(decoded.userId);
  
  if (!user || !user.isActive) {
    throw new UnauthorizedError('Invalid user');
  }
  
  return user;
};
```

### Validación de Entrada
```typescript
// Validar preferencias
const validatePreferences = (prefs: any): UserPreferences => {
  const schema = z.object({
    theme: z.enum(['light', 'dark', 'system']),
    readability: z.object({
      textSize: z.enum(['small', 'normal', 'large']),
      contrast: z.enum(['normal', 'high']),
      spacing: z.enum(['normal', 'wide']),
      colorFilter: z.enum(['none', 'grayscale', 'protanopia', 'deuteranopia', 'tritanopia'])
    })
  });
  
  return schema.parse(prefs);
};
```

## 10. Accesibilidad

### Implementación ARIA
```typescript
// UserMenu accesible
<DropdownMenu>
  <DropdownMenuTrigger
    aria-label="Menu de usuario"
    aria-haspopup="true"
    aria-expanded={dropdownOpen}
  >
    {/* Avatar */}
  </DropdownMenuTrigger>
  
  <DropdownMenuContent
    role="menu"
    aria-label="Opciones de usuario"
  >
    {/* Items con roles apropiados */}
  </DropdownMenuContent>
</DropdownMenu>
```

### Navegación por Teclado
1. **Tab navigation**: Entre elementos del menú
2. **Arrow keys**: Navegar opciones
3. **Enter/Space**: Activar opciones
4. **Escape**: Cerrar menú

## 11. Testing

### Casos de Prueba
1. **Preferencias de accesibilidad**:
   - Aplicación correcta de filtros
   - Persistencia entre sesiones
   - Sincronización entre pestañas

2. **Sistema de créditos**:
   - Actualización en tiempo real
   - Transacciones concurrentes
   - Manejo de errores

3. **Responsive behavior**:
   - Menú en móvil
   - Touch interactions
   - Tamaños de texto adaptativos