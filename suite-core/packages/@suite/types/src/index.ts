// Common types shared across the DiskDominator Suite

export interface User {
  id: string;
  email: string;
  name: string;
  preferences: UserPreferences;
  license?: License;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  accessibility: {
    highContrast: boolean;
    wideSpacing: boolean;
    fontSize: 'small' | 'medium' | 'large';
  };
}

export interface License {
  type: 'trial' | 'basic' | 'pro' | 'enterprise';
  expiresAt?: Date;
  features: string[];
}

// File system types
export interface FileInfo {
  path: string;
  name: string;
  size: number;
  type: 'file' | 'directory';
  modified: Date;
  created?: Date;
  permissions?: string;
  hash?: string;
}

export interface DiskInfo {
  id: string;
  name: string;
  path: string;
  totalSpace: number;
  freeSpace: number;
  usedSpace: number;
  fileSystem?: string;
  isRemovable?: boolean;
}

// AI types
export interface AIProvider {
  id: string;
  name: string;
  type: 'openai' | 'claude' | 'local' | 'custom';
  apiKey?: string;
  endpoint?: string;
  model?: string;
}

export interface AIRequest {
  prompt: string;
  context?: any;
  maxTokens?: number;
  temperature?: number;
}

export interface AIResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  error?: string;
}

// Operations
export interface Operation {
  id: string;
  type: 'scan' | 'organize' | 'delete' | 'move' | 'copy';
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress?: number;
  error?: string;
  result?: any;
}

export interface ScanOptions {
  path: string;
  recursive: boolean;
  includeHidden: boolean;
  excludePatterns?: string[];
  maxDepth?: number;
}