# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DiskDominator is a desktop application for intelligently organizing hard drives using AI assistance. The project consists of:
- **Frontend**: Next.js 14 application with TypeScript (feature-complete, needs backend integration)
- **Backend**: Rust with Tauri framework (pending implementation)
- **AI Integration**: Language model integration for intelligent file analysis

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

### Frontend Structure
- **Next.js 14 App Router**: Single page application with tab-based navigation
- **State Management**: Context providers (Theme, AIAssistant, Readability)
- **UI Library**: shadcn/ui components built on Radix UI primitives
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
- Tauri for desktop integration and file system access
- Rust for performance-critical file operations
- Async operations with progress reporting
- AI model integration for intelligent analysis

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

1. **File Scanning Engine**
   - Recursive directory traversal
   - File metadata extraction
   - Progress reporting

2. **AI Analysis**
   - File categorization
   - Duplicate detection
   - Organization suggestions

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