# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DiskDominator is a desktop application for intelligently organizing hard drives using AI assistance. The project consists of:
- **Frontend**: Next.js application (already completed)
- **Backend**: Rust with Tauri framework
- **AI Integration**: Language model integration for intelligent file analysis

## Development Commands

### Frontend (Next.js)
```bash
cd frontend
npm install          # Install dependencies
npm run dev         # Development server
npm run build       # Production build
npm run lint        # Lint code
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
- Next.js 14+ with App Router
- TypeScript for type safety
- Tailwind CSS for styling
- Components organized by feature

### Backend Structure
- Tauri for desktop integration
- Rust for performance-critical operations
- File system operations handled securely
- AI model integration through API calls

### Communication
- Frontend ↔ Backend: Tauri IPC (Inter-Process Communication)
- Type-safe commands using TypeScript + Rust types
- Async operations for file scanning

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