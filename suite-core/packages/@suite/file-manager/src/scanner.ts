import { FileInfo, DiskInfo, ScanOptions, Operation } from '@suite/types';

export interface Scanner {
  scanDisk(diskId: string, options: ScanOptions): Promise<Operation>;
  getDiskInfo(): Promise<DiskInfo[]>;
  getFileInfo(path: string): Promise<FileInfo>;
  walkDirectory(path: string, options: ScanOptions): AsyncGenerator<FileInfo>;
}

export interface ScanProgress {
  totalFiles: number;
  processedFiles: number;
  totalSize: number;
  processedSize: number;
  currentPath: string;
  errors: ScanError[];
}

export interface ScanError {
  path: string;
  error: string;
  timestamp: Date;
}

export interface ScanResult {
  diskId: string;
  totalFiles: number;
  totalSize: number;
  filesByType: Record<string, number>;
  largestFiles: FileInfo[];
  errors: ScanError[];
  duration: number;
}

// File type detection utilities
export function getFileType(path: string): string {
  const ext = path.toLowerCase().split('.').pop() || '';
  const typeMap: Record<string, string> = {
    // Images
    jpg: 'image', jpeg: 'image', png: 'image', gif: 'image', 
    bmp: 'image', svg: 'image', webp: 'image', ico: 'image',
    // Videos
    mp4: 'video', avi: 'video', mkv: 'video', mov: 'video',
    wmv: 'video', flv: 'video', webm: 'video',
    // Audio
    mp3: 'audio', wav: 'audio', flac: 'audio', aac: 'audio',
    ogg: 'audio', wma: 'audio', m4a: 'audio',
    // Documents
    pdf: 'document', doc: 'document', docx: 'document',
    txt: 'document', rtf: 'document', odt: 'document',
    // Code
    js: 'code', ts: 'code', jsx: 'code', tsx: 'code',
    py: 'code', java: 'code', cpp: 'code', c: 'code',
    rs: 'code', go: 'code', php: 'code', rb: 'code',
    // Archives
    zip: 'archive', rar: 'archive', '7z': 'archive',
    tar: 'archive', gz: 'archive', bz2: 'archive',
    // Data
    json: 'data', xml: 'data', csv: 'data', sql: 'data',
  };
  
  return typeMap[ext] || 'other';
}

// Size formatting utilities
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Path utilities
export function getFileName(path: string): string {
  return path.split(/[/\\]/).pop() || '';
}

export function getDirectory(path: string): string {
  const parts = path.split(/[/\\]/);
  parts.pop();
  return parts.join('/');
}

export function normalizePath(path: string): string {
  return path.replace(/\\/g, '/');
}