# DiskDominator Testing Guide

## 🧪 Resumen de la Batería de Tests

Hemos implementado una batería completa de tests para DiskDominator que cubre:

- **Unit Tests**: Pruebas individuales de funciones y componentes
- **Integration Tests**: Pruebas de flujos completos
- **E2E Tests**: Pruebas de usuario end-to-end
- **Performance Tests**: Pruebas de rendimiento y escalabilidad

## 📁 Estructura de Tests

```
tests/
├── unit/                    # Tests unitarios
├── integration/            # Tests de integración
├── e2e/                    # Tests end-to-end
├── performance/            # Tests de rendimiento
├── test-utils/             # Utilidades compartidas
├── setup.ts                # Configuración global
└── run-tests.sh           # Script ejecutor

src-tauri/src/tests/        # Tests Rust
├── mod.rs
├── home_commands_tests.rs
├── disk_analyzer_tests.rs
└── ...

suite-core/.../hooks/__tests__/  # Tests de hooks React
├── useSystemOverview.test.ts
├── useDuplicatesFinder.test.ts
└── ...
```

## 🚀 Ejecutar Tests

### Todos los tests
```bash
./tests/run-tests.sh all
```

### Por categoría
```bash
./tests/run-tests.sh unit        # Solo unit tests
./tests/run-tests.sh integration # Solo integration tests
./tests/run-tests.sh e2e         # Solo E2E tests
./tests/run-tests.sh performance # Solo performance tests
```

### Tests de Rust específicamente
```bash
cd src-tauri
cargo test
```

### Con coverage
```bash
npm test -- --coverage
./tests/run-tests.sh all --open-coverage
```

## 📋 Tests Implementados

### 1. **Unit Tests (Rust)**

#### `home_commands_tests.rs`
- ✅ `test_get_system_overview` - Verifica estructura de datos del sistema
- ✅ `test_get_recent_activity` - Prueba límites y actividad reciente
- ✅ `test_execute_quick_action` - Valida acciones rápidas
- ✅ `test_refresh_dashboard` - Actualización del dashboard
- ✅ `test_system_summary_calculations` - Cálculos de porcentajes

#### `disk_analyzer_tests.rs`
- ✅ `test_disk_analyzer_scan` - Escaneo básico de archivos
- ✅ `test_duplicate_detection` - Detección de duplicados
- ✅ `test_exclude_patterns` - Patrones de exclusión
- ✅ `test_scan_progress` - Progreso de escaneo
- ✅ `test_scan_type_serialization` - Serialización de tipos

### 2. **Unit Tests (React/TypeScript)**

#### `useSystemOverview.test.ts`
- ✅ Fetch inicial al montar
- ✅ Manejo de errores
- ✅ Refresh manual
- ✅ Auto-refresh con timer
- ✅ Formateo de bytes

#### `useDuplicatesFinder.test.ts`
- ✅ Búsqueda de duplicados
- ✅ Eliminación y refresh
- ✅ Formateo de datos
- ✅ Manejo de errores
- ✅ Errores de permisos

### 3. **E2E Tests**

#### `disk-scanner.e2e.test.ts`
- ✅ Navegación y escaneo de discos
- ✅ Búsqueda y visualización de duplicados
- ✅ Filtrado de archivos grandes
- ✅ Creación de plan de organización
- ✅ Gestión de preferencias de usuario

### 4. **Performance Tests**

#### `large-file-scan.perf.test.ts`
- ✅ Escaneo de 10,000 archivos < 10 segundos
- ✅ Detección de duplicados en 100,000 archivos
- ✅ Eficiencia de memoria con archivos grandes
- ✅ Responsividad de UI durante escaneo

### 5. **Integration Tests**

#### `full-workflow.integration.test.ts`
- ✅ Flujo completo: scan → duplicados → organizar → limpiar
- ✅ Manejo de errores y recuperación
- ✅ Operaciones concurrentes
- ✅ Preferencias de usuario y accesibilidad

## 📊 Métricas de Coverage

### Objetivos mínimos:
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

### Coverage actual (esperado):
- **Backend Rust**: ~75%
- **Frontend React**: ~80%
- **Hooks**: ~85%
- **Componentes UI**: ~70%

## 🔧 Configuración de Tests

### Jest Configuration (`jest.config.js`)
- Ambiente: `jsdom` para tests de React
- Transform: `ts-jest` para TypeScript
- Módulos: Mapeo de alias de paths
- Proyectos: Separación por tipo de test

### Test Setup (`tests/setup.ts`)
- Mock de Tauri API
- Polyfills para Node.js
- Mock de APIs del navegador
- Limpieza después de cada test

## 🎯 Estrategia de Testing

### 1. **Unit Tests**
- Prueban funciones individuales
- Rápidos y aislados
- No requieren entorno completo
- Usan mocks extensivamente

### 2. **Integration Tests**
- Prueban flujos completos
- Verifican interacción entre módulos
- Usan base de datos de prueba
- Simulan sistema de archivos

### 3. **E2E Tests**
- Prueban desde perspectiva del usuario
- Usan Playwright para automatización
- Requieren servidor corriendo
- Verifican UI real

### 4. **Performance Tests**
- Miden tiempos de ejecución
- Verifican uso de memoria
- Prueban con datasets grandes
- Aseguran escalabilidad

## 🐛 Debugging Tests

### Ver output detallado
```bash
npm test -- --verbose
```

### Ejecutar test específico
```bash
npm test -- --testNamePattern="should scan 10,000 files"
```

### Debug con breakpoints
```bash
npm test -- --runInBand --detectOpenHandles
```

### Tests de Rust con output
```bash
cd src-tauri
RUST_LOG=debug cargo test -- --nocapture
```

## ✅ Checklist Pre-Release

Antes de cada release, asegurar:

- [ ] Todos los tests pasan (`./tests/run-tests.sh all`)
- [ ] Coverage > 70% en todas las métricas
- [ ] Tests de performance dentro de límites
- [ ] E2E tests en múltiples resoluciones
- [ ] Tests manuales de accesibilidad
- [ ] Pruebas con datasets reales grandes
- [ ] Tests en Windows nativo (no solo WSL)

## 🔄 Continuous Integration

### GitHub Actions (recomendado)
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - uses: dtolnay/rust-toolchain@stable
      - run: npm install
      - run: ./tests/run-tests.sh all
      - uses: codecov/codecov-action@v3
```

## 🚨 Tests Críticos

Los siguientes tests son críticos y DEBEN pasar siempre:

1. **Escaneo básico de archivos** - Core functionality
2. **Detección de duplicados** - Feature principal
3. **Operaciones de archivos** - Seguridad crítica
4. **Rollback de organización** - Prevención de pérdida de datos
5. **Límites de memoria** - Estabilidad del sistema

## 📝 Agregar Nuevos Tests

Al agregar nueva funcionalidad:

1. **Escribir test que falle primero** (TDD)
2. **Implementar funcionalidad**
3. **Verificar que test pase**
4. **Agregar tests de edge cases**
5. **Actualizar documentación**

Ejemplo:
```typescript
// 1. Test que falla
test('should compress files with custom settings', async () => {
  const result = await compressFile('large.pdf', {
    format: 'zip',
    level: 9,
    password: 'secret'
  });
  expect(result.success).toBe(true);
});

// 2. Implementar función
// 3. Verificar
// 4. Edge cases
// 5. Documentar
```

---

**IMPORTANTE**: Los tests son la red de seguridad del proyecto. Mantenerlos actualizados y funcionando es crítico para la calidad del software.