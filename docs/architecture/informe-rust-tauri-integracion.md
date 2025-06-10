# Guía de Integración Rust/Tauri para DiskDominator

## 🎯 Visión General

Este documento detalla la estrategia técnica para integrar el frontend Next.js existente con un backend Rust usando Tauri, creando una aplicación de escritorio nativa y performante.

## 🏗️ Arquitectura Propuesta

```
┌─────────────────────────────────────────────────────┐
│                   Frontend (Next.js)                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │   Views     │  │ Components  │  │   Hooks     │ │
│  └─────────────┘  └─────────────┘  └─────────────┘ │
└─────────────────────────┬───────────────────────────┘
                          │ IPC Commands
┌─────────────────────────┴───────────────────────────┐
│                    Tauri Bridge                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │   Commands  │  │   Events    │  │   State     │ │
│  └─────────────┘  └─────────────┘  └─────────────┘ │
└─────────────────────────┬───────────────────────────┘
┌─────────────────────────┴───────────────────────────┐
│                   Backend (Rust)                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │ File System │  │  Analyzers  │  │     AI      │ │
│  └─────────────┘  └─────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────┘
```

## 📦 Estructura de Proyecto

```
DiskDominator/
├── src-tauri/
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   ├── src/
│   │   ├── main.rs              # Entry point
│   │   ├── commands/            # Tauri commands
│   │   │   ├── mod.rs
│   │   │   ├── disk.rs          # Disk operations
│   │   │   ├── file.rs          # File operations
│   │   │   ├── scan.rs          # Scanning logic
│   │   │   └── ai.rs            # AI integration
│   │   ├── core/                # Business logic
│   │   │   ├── scanner.rs       # File scanning
│   │   │   ├── analyzer.rs      # File analysis
│   │   │   ├── duplicates.rs    # Duplicate detection
│   │   │   └── organizer.rs     # Organization logic
│   │   ├── models/              # Data structures
│   │   │   ├── file_info.rs
│   │   │   ├── disk_info.rs
│   │   │   └── scan_result.rs
│   │   └── utils/               # Utilities
│   │       ├── hash.rs          # Hashing functions
│   │       ├── cache.rs         # Caching layer
│   │       └── progress.rs      # Progress reporting
│   └── icons/                   # App icons
├── app/                         # Next.js frontend
└── package.json                 # Combined scripts
```

## 🔧 Configuración Inicial

### 1. Inicializar Tauri en el Proyecto Existente

```bash
# En la raíz del proyecto
npm install --save-dev @tauri-apps/cli

# Agregar scripts a package.json
{
  "scripts": {
    "tauri": "tauri",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build"
  }
}

# Inicializar Tauri
npm run tauri init
```

### 2. Configuración de tauri.conf.json

```json
{
  "build": {
    "beforeBuildCommand": "npm run build",
    "beforeDevCommand": "npm run dev",
    "devPath": "http://localhost:3000",
    "distDir": "../out"
  },
  "package": {
    "productName": "DiskDominator",
    "version": "1.0.0"
  },
  "tauri": {
    "allowlist": {
      "all": false,
      "fs": {
        "all": true,
        "scope": ["$HOME", "$DOWNLOAD", "$DOCUMENT"]
      },
      "dialog": {
        "all": true
      },
      "notification": {
        "all": true
      }
    },
    "bundle": {
      "active": true,
      "category": "Utility",
      "copyright": "© 2024 DiskDominator",
      "identifier": "com.diskdominator.app",
      "icon": ["icons/icon.ico", "icons/icon.png", "icons/icon.icns"]
    },
    "security": {
      "csp": null
    },
    "updater": {
      "active": true,
      "endpoints": ["https://api.diskdominator.com/updates"]
    },
    "windows": [{
      "title": "DiskDominator",
      "width": 1200,
      "height": 800,
      "minWidth": 800,
      "minHeight": 600,
      "resizable": true,
      "decorations": true,
      "transparent": false
    }]
  }
}
```

### 3. Cargo.toml Base

```toml
[package]
name = "disk-dominator"
version = "1.0.0"
edition = "2021"

[build-dependencies]
tauri-build = { version = "1.5", features = [] }

[dependencies]
tauri = { version = "1.5", features = ["shell-open", "notification-all"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
tokio = { version = "1", features = ["full"] }
walkdir = "2"
blake3 = "1.5"
rayon = "1.8"
chrono = "0.4"
bytes = "1.5"
mime_guess = "2.0"
notify = "6.1"
rusqlite = { version = "0.30", features = ["bundled"] }
thiserror = "1.0"
anyhow = "1.0"
log = "0.4"
env_logger = "0.10"

[features]
default = ["custom-protocol"]
custom-protocol = ["tauri/custom-protocol"]
```

## 🔌 Implementación de Comandos IPC

### Frontend: Crear API Client

```typescript
// lib/tauri-api.ts
import { invoke } from '@tauri-apps/api/tauri';
import { listen } from '@tauri-apps/api/event';

export interface DiskInfo {
  name: string;
  mountPoint: string;
  totalSpace: number;
  freeSpace: number;
  isRemovable: boolean;
}

export interface ScanProgress {
  current: number;
  total: number;
  currentPath: string;
}

export interface FileInfo {
  path: string;
  name: string;
  size: number;
  modified: number;
  isDirectory: boolean;
  hash?: string;
}

// Commands
export const TauriAPI = {
  // Disk operations
  async getDisks(): Promise<DiskInfo[]> {
    return await invoke('get_disks');
  },

  // Scanning
  async startScan(path: string, options: ScanOptions): Promise<string> {
    return await invoke('start_scan', { path, options });
  },

  async cancelScan(scanId: string): Promise<void> {
    return await invoke('cancel_scan', { scanId });
  },

  // File operations
  async getFileInfo(path: string): Promise<FileInfo> {
    return await invoke('get_file_info', { path });
  },

  async moveFiles(files: string[], destination: string): Promise<void> {
    return await invoke('move_files', { files, destination });
  },

  async deleteFiles(files: string[], permanent: boolean = false): Promise<void> {
    return await invoke('delete_files', { files, permanent });
  },

  // Duplicate detection
  async findDuplicates(paths: string[]): Promise<DuplicateGroup[]> {
    return await invoke('find_duplicates', { paths });
  },

  // Events
  onScanProgress(callback: (progress: ScanProgress) => void) {
    return listen<ScanProgress>('scan-progress', (event) => {
      callback(event.payload);
    });
  }
};
```

### Backend: Implementar Comandos

```rust
// src-tauri/src/commands/disk.rs
use serde::{Deserialize, Serialize};
use std::path::Path;
use sysinfo::{DiskExt, System, SystemExt};

#[derive(Debug, Serialize, Deserialize)]
pub struct DiskInfo {
    name: String,
    mount_point: String,
    total_space: u64,
    free_space: u64,
    is_removable: bool,
}

#[tauri::command]
pub async fn get_disks() -> Result<Vec<DiskInfo>, String> {
    let mut sys = System::new_all();
    sys.refresh_disks_list();
    
    let disks: Vec<DiskInfo> = sys.disks()
        .iter()
        .map(|disk| DiskInfo {
            name: disk.name().to_string_lossy().to_string(),
            mount_point: disk.mount_point().to_string_lossy().to_string(),
            total_space: disk.total_space(),
            free_space: disk.available_space(),
            is_removable: disk.is_removable(),
        })
        .collect();
    
    Ok(disks)
}
```

```rust
// src-tauri/src/commands/scan.rs
use crate::core::scanner::Scanner;
use tauri::Manager;
use uuid::Uuid;

#[tauri::command]
pub async fn start_scan(
    window: tauri::Window,
    path: String,
    options: ScanOptions,
) -> Result<String, String> {
    let scan_id = Uuid::new_v4().to_string();
    let scanner = Scanner::new(options);
    
    // Spawn scanning task
    tokio::spawn(async move {
        let result = scanner.scan_directory(&path, |progress| {
            // Emit progress events
            window.emit("scan-progress", progress).ok();
        }).await;
        
        // Emit completion event
        window.emit("scan-complete", result).ok();
    });
    
    Ok(scan_id)
}
```

## 🔄 Patrones de Integración

### 1. Estado Compartido

```rust
// src-tauri/src/main.rs
use std::sync::{Arc, Mutex};
use tauri::State;

struct AppState {
    scans: Arc<Mutex<HashMap<String, ScanState>>>,
    cache: Arc<Mutex<FileCache>>,
}

fn main() {
    tauri::Builder::default()
        .manage(AppState {
            scans: Arc::new(Mutex::new(HashMap::new())),
            cache: Arc::new(Mutex::new(FileCache::new())),
        })
        .invoke_handler(tauri::generate_handler![
            get_disks,
            start_scan,
            cancel_scan,
            // ... más comandos
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### 2. Manejo de Errores

```rust
// src-tauri/src/error.rs
use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    
    #[error("Permission denied: {0}")]
    PermissionDenied(String),
    
    #[error("File not found: {0}")]
    FileNotFound(String),
}

// Conversión automática para comandos Tauri
impl From<AppError> for String {
    fn from(err: AppError) -> Self {
        err.to_string()
    }
}
```

### 3. Progress Reporting

```rust
// src-tauri/src/utils/progress.rs
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::mpsc;

#[derive(Clone, Serialize, Deserialize)]
pub struct Progress {
    pub current: u64,
    pub total: u64,
    pub message: String,
    pub percentage: f32,
}

pub struct ProgressReporter {
    tx: mpsc::Sender<Progress>,
}

impl ProgressReporter {
    pub async fn report(&self, current: u64, total: u64, message: String) {
        let progress = Progress {
            current,
            total,
            message,
            percentage: (current as f32 / total as f32) * 100.0,
        };
        
        self.tx.send(progress).await.ok();
    }
}
```

## 🚀 Optimizaciones Clave

### 1. Paralelización con Rayon

```rust
use rayon::prelude::*;

pub fn calculate_hashes(files: Vec<PathBuf>) -> Vec<(PathBuf, String)> {
    files.par_iter()
        .map(|path| {
            let hash = calculate_file_hash(path)?;
            Ok((path.clone(), hash))
        })
        .filter_map(Result::ok)
        .collect()
}
```

### 2. Caching con SQLite

```rust
// src-tauri/src/utils/cache.rs
use rusqlite::{Connection, Result};

pub struct FileCache {
    conn: Connection,
}

impl FileCache {
    pub fn new() -> Result<Self> {
        let conn = Connection::open("cache.db")?;
        
        conn.execute(
            "CREATE TABLE IF NOT EXISTS file_hashes (
                path TEXT PRIMARY KEY,
                hash TEXT NOT NULL,
                modified INTEGER NOT NULL
            )",
            [],
        )?;
        
        Ok(Self { conn })
    }
    
    pub fn get_hash(&self, path: &str) -> Result<Option<String>> {
        // Check if file hasn't changed
        // Return cached hash if valid
    }
}
```

### 3. Streaming para Archivos Grandes

```rust
use tokio::io::{AsyncReadExt, BufReader};
use tokio::fs::File;

pub async fn hash_large_file(path: &Path) -> Result<String> {
    let file = File::open(path).await?;
    let mut reader = BufReader::new(file);
    let mut hasher = blake3::Hasher::new();
    let mut buffer = vec![0; 1024 * 1024]; // 1MB chunks
    
    loop {
        let n = reader.read(&mut buffer).await?;
        if n == 0 { break; }
        hasher.update(&buffer[..n]);
    }
    
    Ok(hasher.finalize().to_hex().to_string())
}
```

## 🧪 Testing Strategy

### Rust Unit Tests

```rust
#[cfg(test)]
mod tests {
    use super::*;
    
    #[tokio::test]
    async fn test_scan_directory() {
        let scanner = Scanner::new(Default::default());
        let result = scanner.scan_directory("./test_data").await;
        assert!(result.is_ok());
        assert_eq!(result.unwrap().files.len(), 10);
    }
}
```

### Integration Tests

```rust
// tests/integration_test.rs
use tauri::test::{mock_builder, MockRuntime};

#[test]
fn test_get_disks_command() {
    let app = mock_builder::<MockRuntime>()
        .invoke_handler(tauri::generate_handler![get_disks])
        .build(tauri::generate_context!())
        .unwrap();
        
    let window = app.get_window("main").unwrap();
    let result: Vec<DiskInfo> = tauri::test::get_ipc_response(
        &window,
        tauri::test::InvokeRequest {
            cmd: "get_disks".into(),
            callback: 0,
            error: 1,
            ..Default::default()
        },
    );
    
    assert!(!result.is_empty());
}
```

## 📊 Métricas y Monitoreo

```rust
// src-tauri/src/utils/metrics.rs
use prometheus::{Counter, Histogram, Registry};

pub struct Metrics {
    pub scan_duration: Histogram,
    pub files_processed: Counter,
    pub errors_total: Counter,
}

impl Metrics {
    pub fn new() -> Self {
        let registry = Registry::new();
        
        Self {
            scan_duration: Histogram::with_opts(
                HistogramOpts::new("scan_duration_seconds", "Scan duration in seconds")
            ).unwrap(),
            files_processed: Counter::new("files_processed_total", "Total files processed").unwrap(),
            errors_total: Counter::new("errors_total", "Total errors").unwrap(),
        }
    }
}
```

## 🔐 Consideraciones de Seguridad

1. **Sandboxing**: Usar allowlist estricta en tauri.conf.json
2. **Validación**: Siempre validar paths antes de operaciones
3. **Permisos**: Verificar permisos antes de modificar archivos
4. **CSP**: Configurar Content Security Policy apropiada

## 🎯 Próximos Pasos

1. Crear estructura de carpetas src-tauri
2. Implementar comandos básicos (get_disks, scan_directory)
3. Integrar con hooks existentes en el frontend
4. Reemplazar datos mock con llamadas reales
5. Implementar sistema de caché
6. Añadir tests unitarios y de integración
7. Configurar CI/CD para builds automáticos

Esta integración transformará DiskDominator en una aplicación de escritorio nativa y performante, manteniendo la excelente UI ya desarrollada.