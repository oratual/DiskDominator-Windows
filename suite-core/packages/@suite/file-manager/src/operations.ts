import { FileInfo, Operation } from '@suite/types';

export type FileOperation = 'move' | 'copy' | 'delete' | 'rename' | 'compress';

export interface FileOperationOptions {
  overwrite?: boolean;
  createDirectories?: boolean;
  preserveTimestamps?: boolean;
  atomic?: boolean;
}

export interface BatchOperation {
  id: string;
  operations: SingleOperation[];
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  errors: OperationError[];
}

export interface SingleOperation {
  id: string;
  type: FileOperation;
  source: string;
  destination?: string;
  options?: FileOperationOptions;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error?: string;
}

export interface OperationError {
  operationId: string;
  path: string;
  error: string;
  timestamp: Date;
}

export interface FileOperator {
  move(source: string, destination: string, options?: FileOperationOptions): Promise<void>;
  copy(source: string, destination: string, options?: FileOperationOptions): Promise<void>;
  delete(path: string, options?: { permanent?: boolean }): Promise<void>;
  rename(path: string, newName: string): Promise<void>;
  compress(paths: string[], destination: string, format?: 'zip' | '7z' | 'tar'): Promise<void>;
  
  // Batch operations
  createBatch(operations: SingleOperation[]): BatchOperation;
  executeBatch(batch: BatchOperation): Promise<BatchOperation>;
  cancelBatch(batchId: string): Promise<void>;
}

// Operation result types
export interface MoveResult {
  moved: string[];
  failed: Array<{ path: string; error: string }>;
}

export interface DeleteResult {
  deleted: string[];
  failed: Array<{ path: string; error: string }>;
}

export interface CompressResult {
  archive: string;
  size: number;
  files: number;
  compressionRatio: number;
}

// Validation utilities
export function validatePath(path: string): boolean {
  // Basic path validation
  if (!path || path.length === 0) return false;
  
  // Check for invalid characters
  const invalidChars = /[<>:"|?*]/;
  if (invalidChars.test(path)) return false;
  
  // Check for reserved names on Windows
  const reservedNames = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i;
  const fileName = path.split(/[/\\]/).pop() || '';
  if (reservedNames.test(fileName.split('.')[0])) return false;
  
  return true;
}

export function isSubPath(child: string, parent: string): boolean {
  const normalizedChild = child.toLowerCase().replace(/\\/g, '/');
  const normalizedParent = parent.toLowerCase().replace(/\\/g, '/');
  return normalizedChild.startsWith(normalizedParent);
}