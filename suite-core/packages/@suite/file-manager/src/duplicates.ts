import { FileInfo, Operation } from '@suite/types';

export interface DuplicateGroup {
  id: string;
  hash: string;
  name: string;
  type: 'file' | 'folder';
  mimeType?: string;
  totalSize: number;
  totalCount: number;
  recoverable: number;
  items: DuplicateItem[];
}

export interface DuplicateItem {
  id: string;
  path: string;
  size: number;
  modified: Date;
  created: Date;
  disk: string;
  isOriginal: boolean;
  shouldKeep: boolean;
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
    bitrate?: number;
  };
}

export type DuplicateDetectionMethod = 'hash' | 'name' | 'size' | 'content';
export type GroupingMethod = 'hash' | 'name' | 'type' | 'location';

export interface DuplicateScanOptions {
  disks: string[];
  minSize?: number;
  maxSize?: number;
  includeHidden?: boolean;
  includeSystem?: boolean;
  fileTypes?: string[];
  excludePaths?: string[];
  method: DuplicateDetectionMethod;
  groupBy: GroupingMethod;
}

export interface DuplicateDetector {
  detectDuplicates(options: DuplicateScanOptions): Promise<DuplicateGroup[]>;
  determineOriginal(items: DuplicateItem[]): DuplicateItem;
  calculateSavings(groups: DuplicateGroup[]): {
    totalSize: number;
    recoverable: number;
    byDisk: Record<string, number>;
    byType: Record<string, number>;
  };
}

// Smart duplicate detection algorithm
export function determineOriginal(items: DuplicateItem[]): DuplicateItem {
  // Sort by multiple criteria to find the best "original"
  const sorted = [...items].sort((a, b) => {
    // 1. Prefer items not in temp/cache/backup folders
    const aIsTemp = /\/(temp|cache|backup|tmp)\//i.test(a.path);
    const bIsTemp = /\/(temp|cache|backup|tmp)\//i.test(b.path);
    if (aIsTemp !== bIsTemp) return aIsTemp ? 1 : -1;

    // 2. Prefer older creation date (original)
    const createdDiff = a.created.getTime() - b.created.getTime();
    if (createdDiff !== 0) return createdDiff;

    // 3. Prefer organized locations (Documents, Projects, etc)
    const aIsOrganized = /\/(documents|projects|work)\//i.test(a.path);
    const bIsOrganized = /\/(documents|projects|work)\//i.test(b.path);
    if (aIsOrganized !== bIsOrganized) return aIsOrganized ? -1 : 1;

    // 4. Prefer shorter paths (less nested)
    const aDepth = a.path.split(/[/\\]/).length;
    const bDepth = b.path.split(/[/\\]/).length;
    return aDepth - bDepth;
  });

  return sorted[0];
}

// Calculate potential disk space savings
export function calculateSavings(groups: DuplicateGroup[]): {
  totalSize: number;
  recoverable: number;
  byDisk: Record<string, number>;
  byType: Record<string, number>;
} {
  const byDisk: Record<string, number> = {};
  const byType: Record<string, number> = {};
  let totalSize = 0;
  let recoverable = 0;

  groups.forEach(group => {
    totalSize += group.totalSize;
    recoverable += group.recoverable;

    group.items.forEach(item => {
      if (!item.shouldKeep) {
        byDisk[item.disk] = (byDisk[item.disk] || 0) + item.size;
        byType[group.type] = (byType[group.type] || 0) + item.size;
      }
    });
  });

  return { totalSize, recoverable, byDisk, byType };
}