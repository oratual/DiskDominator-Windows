# DiskDominator API Documentation

## Overview

DiskDominator provides a comprehensive API through Tauri IPC commands for file system operations, AI-powered analysis, and disk management.

## Core Commands

### File System Operations

#### `scan_disk`
Scans a directory and returns file information.

**Parameters:**
- `path`: string - The directory path to scan
- `options`: ScanOptions
  - `scan_type`: "Quick" | "Deep" | "Custom"
  - `exclude_patterns`: string[] - Patterns to exclude from scan

**Returns:** `FileInfo[]`

**Example:**
```typescript
const files = await invoke('scan_disk', {
  path: 'C:\\Users\\Documents',
  options: {
    scan_type: 'Deep',
    exclude_patterns: ['node_modules', '.git']
  }
});
```

#### `get_disk_info`
Retrieves information about available disks.

**Parameters:** None

**Returns:** `DiskInfo[]`
```typescript
interface DiskInfo {
  name: string;
  mount_point: string;
  total_space: number;
  available_space: number;
  used_space: number;
  file_system: string;
}
```

#### `get_large_files`
Gets files above a specified size threshold.

**Parameters:**
- `min_size_mb`: number - Minimum file size in megabytes

**Returns:** `FileInfo[]`

#### `find_duplicates`
Finds duplicate files based on content hash.

**Parameters:** None (uses cached scan results)

**Returns:** `DuplicateGroup[]`
```typescript
interface DuplicateGroup {
  hash: string;
  files: FileInfo[];
  total_size: number;
  potential_savings: number;
}
```

#### `perform_file_operation`
Executes file operations like move, delete, or rename.

**Parameters:**
- `operation`: FileOperation
  - `operation`: "move" | "delete" | "rename"
  - `source`: string
  - `destination`: string (optional)

**Returns:** `boolean`

### AI Operations

#### `ai_analyze`
Performs AI analysis on files or directories.

**Parameters:**
- `request`: AIAnalysisRequest
  - `path`: string
  - `analysis_type`: "categorize" | "suggest_cleanup" | "identify_important"

**Returns:** `AIAnalysisResponse`
```typescript
interface AIAnalysisResponse {
  suggestions: string[];
  categories: FileCategory[];
  confidence: number;
}
```

### Authentication

#### `auth_login`
Authenticates a user.

**Parameters:**
- `credentials`: LoginRequest
  - `username`: string
  - `password`: string

**Returns:** `LoginResponse`
```typescript
interface LoginResponse {
  success: boolean;
  user?: User;
  token?: string;
}
```

#### `auth_logout`
Logs out the current user.

**Parameters:** None

**Returns:** `boolean`

### Localization

#### `set_language`
Changes the application language.

**Parameters:**
- `language`: string - Language code (e.g., "en-US", "es-ES")

**Returns:** `boolean`

### Updates

#### `check_updates`
Checks for available application updates.

**Parameters:** None

**Returns:** `UpdateInfo | null`
```typescript
interface UpdateInfo {
  version: string;
  release_notes: string;
  download_url: string;
  size: number;
  is_mandatory: boolean;
}
```

## React Hooks

### `useTauri()`
Detects if running in Tauri environment.

```typescript
const isTauri = useTauri();
```

### `useDiskScanner()`
Manages disk scanning operations.

```typescript
const {
  scanning,
  progress,
  results,
  error,
  startScan,
  cancelScan
} = useDiskScanner();

// Start a scan
await startScan('C:\\', { 
  scan_type: 'Deep',
  exclude_patterns: ['node_modules']
});
```

### `useFileOperations()`
Handles file operations.

```typescript
const {
  operating,
  moveFile,
  deleteFile,
  renameFile
} = useFileOperations();

// Move a file
const result = await moveFile(
  'C:\\source\\file.txt',
  'C:\\dest\\file.txt'
);
```

### `useAIAssistant()`
Integrates AI analysis features.

```typescript
const {
  analyzing,
  lastAnalysis,
  categorizeFiles,
  suggestCleanup,
  identifyImportantFiles
} = useAIAssistant();

// Get AI suggestions
const suggestions = await suggestCleanup('C:\\Downloads');
```

## Error Handling

All commands return errors as strings. Common error types:

- `"File not found"` - The specified file or directory doesn't exist
- `"Permission denied"` - Insufficient permissions for the operation
- `"Operation cancelled"` - The user cancelled the operation
- `"API error: [details]"` - AI provider API errors
- `"Service unavailable"` - AI service is not accessible

## Events

DiskDominator emits events for real-time updates:

### `scan-progress`
Emitted during file scanning.

```typescript
window.__TAURI__.event.listen('scan-progress', (event) => {
  const progress = event.payload as ScanProgress;
  console.log(`Scanning: ${progress.current_path}`);
  console.log(`Progress: ${progress.percentage}%`);
});
```

### `file-operation-complete`
Emitted when a file operation completes.

```typescript
window.__TAURI__.event.listen('file-operation-complete', (event) => {
  const result = event.payload;
  console.log(`Operation completed: ${result.success}`);
});
```

## Configuration

The API behavior can be configured through `config.toml`:

```toml
[ai]
provider = "OpenAI"  # or "Claude", "Ollama", "Mock"
api_key = "your-key"
model = "gpt-3.5-turbo"

[scanner]
max_threads = 4
exclude_patterns = ["node_modules", ".git"]
```

## Rate Limiting

- AI operations: 60 requests per minute
- File operations: No limit
- Scan operations: 10 concurrent scans maximum

## Security

- All file operations are sandboxed to user-permitted directories
- API keys are stored securely in the system keychain
- File paths are sanitized before operations