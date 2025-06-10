# DiskDominator Suite - Modular Architecture

## 🎯 Overview

DiskDominator is the flagship product of a **modular software suite** for desktop productivity tools. This architecture enables rapid development of multiple products while sharing core functionality.

## 🏗️ Architecture

```
DiskDominator/
├── core-modules/          # Shared modules for entire suite
│   ├── auth-module/       # Authentication & user management
│   ├── i18n-module/       # Internationalization
│   ├── ai-module/         # AI integrations (OpenAI, Claude, etc.)
│   ├── ui-components/     # Shared UI components
│   ├── update-module/     # Auto-update system
│   ├── storage-module/    # Data persistence
│   └── logger-module/     # Centralized logging
├── src-tauri/            # Rust backend with Tauri
│   ├── src/
│   │   ├── commands/     # Tauri command handlers
│   │   ├── file_system/  # File operations
│   │   └── disk_analyzer/# Core analysis logic
│   └── tauri.conf.json   # Tauri configuration
└── app/                  # Next.js frontend
    ├── components/       # React components
    ├── hooks/           # Custom React hooks
    └── views/           # Feature views
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Rust 1.70+
- Windows: WebView2 (included in Windows 11)
- Linux: WebKitGTK
- macOS: WebKit (included)

### Setup Development Environment

```bash
# Clone repository
git clone [repo-url]
cd DiskDominator

# Run setup script
./scripts/setup.sh

# Start development
npm run tauri:dev
```

## 🔧 Core Modules

### 1. **Auth Module** (`auth-module`)
- Single Sign-On for entire suite
- User preferences sync
- License management
- Multi-provider support

### 2. **I18n Module** (`i18n-module`)
- Centralized translations
- Automatic language detection
- Hot-reload in development
- Shared terms across products

### 3. **AI Module** (`ai-module`)
- Multiple provider support (OpenAI, Claude, Ollama)
- Cost tracking and limits
- Intelligent file categorization
- Smart organization suggestions

### 4. **Storage Module** (`storage-module`)
- Persistent data storage
- Cache management
- Settings synchronization
- Cross-platform paths

### 5. **Logger Module** (`logger-module`)
- Structured logging
- Performance metrics
- Error tracking
- Debug levels

## 📦 Development Commands

### Frontend (Next.js)
```bash
npm run dev          # Start Next.js dev server
npm run build        # Build for production
npm run lint         # Lint code
```

### Backend (Rust/Tauri)
```bash
cargo build          # Build Rust modules
cargo test           # Run tests
cargo check          # Fast type checking
```

### Full Application
```bash
npm run tauri:dev    # Development mode
npm run tauri:build  # Production build
```

## 🔌 Integration with Tauri

### Frontend Hooks

```typescript
// Use Tauri functionality
import { useDiskScanner } from '@/hooks/use-disk-scanner';

const { scanning, progress, results, startScan } = useDiskScanner();

// Start a scan
await startScan('C:\\', { 
  scan_type: 'Deep',
  exclude_patterns: ['node_modules', '.git']
});
```

### Backend Commands

```rust
#[tauri::command]
async fn scan_disk(
    path: String,
    options: ScanOptions,
    state: State<'_, AppState>,
) -> Result<Vec<FileInfo>, String> {
    // Implementation
}
```

## 🎨 Adding New Features

### 1. Create Module (if shared)
```bash
cd core-modules
cargo new my-module --lib
```

### 2. Add to Workspace
```toml
# Cargo.toml
[workspace]
members = [
    # ...
    "core-modules/my-module"
]
```

### 3. Use in Application
```rust
// src-tauri/Cargo.toml
[dependencies]
my_module = { path = "../core-modules/my-module" }
```

## 🧪 Testing

### Unit Tests
```bash
# Rust modules
cargo test --workspace

# Frontend components
npm run test
```

### Integration Tests
```bash
# Test Tauri commands
cargo test --test integration
```

## 📊 Performance Targets

- **Scan Speed**: 100k files < 10 seconds
- **Memory Usage**: < 200MB idle
- **Startup Time**: < 3 seconds
- **UI Response**: < 100ms for user actions

## 🚢 Building for Production

### Windows
```bash
npm run tauri:build -- --target x86_64-pc-windows-msvc
```

### macOS
```bash
npm run tauri:build -- --target universal-apple-darwin
```

### Linux
```bash
npm run tauri:build -- --target x86_64-unknown-linux-gnu
```

## 🔄 Suite Development Workflow

1. **Module First**: Build shared functionality as modules
2. **Test in Isolation**: Each module has its own tests
3. **Integrate Gradually**: Add to products as needed
4. **Version Carefully**: Use semantic versioning

## 📚 Documentation

- [Architecture Overview](./docs/architecture.md)
- [Module Development Guide](./docs/modules.md)
- [API Reference](./docs/api.md)
- [Contributing Guidelines](./CONTRIBUTING.md)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](./CONTRIBUTING.md) for details.

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

---

**DiskDominator** - Part of the next-generation productivity suite