# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DiskDominator is the **flagship product of a modular software suite** for desktop productivity tools. As the first product, it establishes the architecture for shared modules while providing intelligent hard drive organization with AI assistance.

### Suite Architecture Vision
- **Modular Design**: Core modules (auth, i18n, AI, UI) shared across all suite products
- **Platform Priority**: Windows primary target, macOS secondary
- **Scalable Foundation**: Architecture supports rapid development of additional products

### DiskDominator Components
- **Frontend**: Next.js 14 application with TypeScript (feature-complete, needs backend integration)
- **Backend**: Rust with Tauri framework (pending implementation)
- **Core Modules**: Shared authentication, localization, AI integration, and UI components
- **AI Integration**: Modular AI provider system supporting multiple LLMs

## Development Commands

### Frontend (Next.js)
```bash
npm install          # Install dependencies
npm run dev          # Development server (http://localhost:3000)
npm run build        # Production build
npm run lint         # Lint code

# Note: No test or typecheck scripts defined in package.json yet
```

### Backend (Rust/Tauri)
```bash
cd src-tauri
cargo build         # Build Rust backend
cargo test          # Run tests
cargo tauri dev     # Run in development mode
cargo tauri build   # Build for production
```

## Architecture

### Suite Module Structure (New)
```
DiskDominator/
├── core-modules/           # Shared across all suite products
│   ├── auth-module/       # User authentication
│   ├── i18n-module/       # Localization
│   ├── ai-module/         # AI providers
│   ├── ui-components/     # Shared UI
│   └── update-module/     # Auto-updates
├── src-tauri/             # DiskDominator backend
└── app/                   # DiskDominator frontend
```

### Frontend Structure
- **Next.js 14 App Router**: Single page application with tab-based navigation
- **State Management**: Context providers (Theme, AIAssistant, Readability)
- **UI Library**: shadcn/ui components built on Radix UI primitives (to be modularized)
- **Styling**: Tailwind CSS with dark mode and accessibility features
- **Entry Point**: `app/page.tsx` renders `DiskDominatorV2` component

### Component Architecture
```
DiskDominatorV2 (Main Container)
├── TabNavigation (Primary: Home, Analyze, Duplicates | Secondary: Big Files, Organize)
├── UserMenu/UserProfileButton (User settings and preferences)
└── View Components (Feature-specific views)
    ├── HomeView - Dashboard and quick actions
    ├── DiskStatusView - Disk analysis and scanning
    ├── DuplicatesView - Find and manage duplicate files
    ├── BigFilesView - Large file management
    └── OrganizeView - AI-powered file organization
```

### Expected Tauri Integration Points
The frontend expects these Tauri commands (to be implemented):
- `scan_disk(disk_id: string, scan_type: ScanType)` - Start disk analysis
- `get_disk_status()` - Get current analysis status
- `get_large_files(min_size: number)` - Retrieve files above threshold
- `find_duplicates()` - Detect duplicate files
- `organize_files(rules: OrganizeRules)` - Apply organization rules
- `get_file_metadata(path: string)` - Get file details
- `perform_file_operation(operation: FileOp, paths: string[])` - Move/delete files

### Backend Structure (To Be Implemented)
- **Tauri**: Desktop integration with Windows-first approach
- **Rust Modules**: Performance-critical operations as shared libraries
- **Async Architecture**: Non-blocking operations with progress reporting
- **Modular AI Integration**: Pluggable providers (OpenAI, Claude, local models)
- **Platform Abstraction**: Clean separation of Windows/macOS specific code

## Claude Squad Workflow

This project uses 4 Claude instances for parallel development:

1. **Frontend Instance**: UI/UX improvements, component development
2. **Backend Instance**: Rust core logic, file system operations
3. **AI Instance**: Model integration, intelligent analysis features
4. **Testing Instance**: Unit tests, integration tests, E2E tests

### Task Distribution
- Use `cs` command to manage instances
- Each instance works on isolated git branches
- Merge via pull requests after review

## Key Features to Implement

### Core Modules (Shared Across Suite)
1. **Authentication Module**
   - User accounts with suite-wide SSO
   - License management
   - Settings sync across products

2. **AI Module**
   - Provider abstraction (OpenAI, Claude, local)
   - Cost tracking and limits
   - Prompt templates per product

3. **I18n Module**
   - Multi-language support
   - Locale detection
   - Centralized translations

### DiskDominator Specific
1. **File Scanning Engine**
   - Recursive directory traversal
   - File metadata extraction
   - Progress reporting

2. **AI-Powered Analysis**
   - File categorization using AI module
   - Duplicate detection algorithms
   - Smart organization suggestions

3. **User Interface**
   - Real-time progress updates
   - Interactive file tree
   - Drag-and-drop organization

## Security Considerations

- Never expose file paths outside of user-selected directories
- Sanitize all file operations
- Use Tauri's permission system for file access
- No network requests without user consent

## Testing Strategy

- Unit tests for Rust modules
- Component tests for React components
- Integration tests for Tauri commands
- E2E tests for critical user flows

## Frontend Implementation Details

### Current State
- **Feature-complete UI** with all views implemented
- **Mock data** used throughout - needs backend integration
- **Accessibility features**: High contrast mode, wide spacing, enhanced readability
- **Dark/Light theme** support with system preference detection
- **AI Assistant** integrated in each view for contextual help

### Key Implementation Patterns

1. **Mock Data Simulation**
   - Components use `setTimeout` to simulate async operations
   - Progress tracking implemented but uses fake timers
   - File operations show UI feedback but don't persist

2. **View-Specific Features**
   - **DiskStatusView**: Disk selection, scan types, exclude patterns
   - **DuplicatesView**: Group by hash/name/size, preview, batch operations
   - **BigFilesView**: Size filtering, directory tree, storage stats
   - **OrganizeView**: Rule-based organization, AI suggestions, preview mode

3. **Build Configuration** (next.config.mjs)
   ```javascript
   reactStrictMode: false,  // Disabled to reduce hydration issues
   images: { unoptimized: true },  // For desktop app
   typescript: { ignoreBuildErrors: true },  // Temporary - should be fixed
   eslint: { ignoreDuringBuilds: true }  // Temporary - should be fixed
   ```

### Integration Checklist for Backend Development
- [ ] Replace mock disk data with real system disk information
- [ ] Implement file system scanning with progress callbacks
- [ ] Add proper error handling for file permissions
- [ ] Create IPC bridge for all file operations
- [ ] Implement real duplicate detection algorithm
- [ ] Add file metadata caching for performance
- [ ] Integrate AI model for organization suggestions
- [ ] Handle large file lists with virtualization