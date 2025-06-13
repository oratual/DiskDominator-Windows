import { useState, useCallback } from 'react';
import { invoke } from './use-tauri';

export interface DuplicateGroup {
  id: string;
  hash: string;
  name: string;
  file_type: string;
  total_size: number;
  recoverable_size: number;
  copies: DuplicateCopy[];
}

export interface DuplicateCopy {
  id: string;
  path: string;
  disk: string;
  size: number;
  created: number;
  modified: number;
  accessed: number;
  is_original: boolean;
  keep_suggestion: boolean;
  metadata?: FileMetadata;
}

export interface FileMetadata {
  width?: number;
  height?: number;
  duration?: number;
  bitrate?: number;
}

export interface DuplicateSummary {
  total_groups: number;
  total_duplicates: number;
  total_size: number;
  recoverable_size: number;
}

export type DetectionMethod = 'hash' | 'name' | 'size' | 'name_and_size';

export interface DuplicateOptions {
  disks?: string[];
  types?: string[];
  min_size?: number;
  max_size?: number;
  sort_by?: string;
  group_by?: string;
  detection_method: DetectionMethod;
}

export interface DeleteBatchResult {
  deleted: string[];
  failed: { id: string; error: string }[];
  space_saved: number;
}

export const useDuplicatesFinder = () => {
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [summary, setSummary] = useState<DuplicateSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const findDuplicates = useCallback(async (options: DuplicateOptions) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await invoke<{ groups: any; summary: any }>(
        'get_duplicate_groups',
        { options }
      );
      
      const groups = result.groups as DuplicateGroup[];
      const summary = result.summary as DuplicateSummary;
      
      setDuplicates(groups);
      setSummary(summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to find duplicates');
    } finally {
      setLoading(false);
    }
  }, []);

  const findDuplicatesSimple = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use the original find_duplicates for backward compatibility
      const result = await invoke<any[]>('find_duplicates');
      
      // Convert old format to new format if needed
      const groups: DuplicateGroup[] = result.map((group, index) => ({
        id: group.id || `group-${index}`,
        hash: group.hash || '',
        name: group.files?.[0]?.name || 'Unknown',
        file_type: 'unknown',
        total_size: group.total_size || 0,
        recoverable_size: group.potential_savings || 0,
        copies: group.files?.map((file: any, idx: number) => ({
          id: `${index}-${idx}`,
          path: file.path,
          disk: file.path.charAt(0),
          size: file.size,
          created: new Date(file.created).getTime(),
          modified: new Date(file.modified).getTime(),
          accessed: new Date(file.modified).getTime(),
          is_original: idx === 0,
          keep_suggestion: idx === 0,
          metadata: null,
        })) || [],
      }));
      
      setDuplicates(groups);
      
      // Calculate summary
      const summary: DuplicateSummary = {
        total_groups: groups.length,
        total_duplicates: groups.reduce((sum, g) => sum + g.copies.length, 0),
        total_size: groups.reduce((sum, g) => sum + g.total_size, 0),
        recoverable_size: groups.reduce((sum, g) => sum + g.recoverable_size, 0),
      };
      setSummary(summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to find duplicates');
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteDuplicatesBatch = useCallback(async (fileIds: string[], moveToTrash = true) => {
    try {
      const result = await invoke<DeleteBatchResult>('delete_duplicates_batch', {
        file_ids: fileIds,
        move_to_trash: moveToTrash,
      });
      
      // Refresh duplicates list
      if (duplicates.length > 0) {
        await findDuplicatesSimple();
      }
      
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete files');
      throw err;
    }
  }, [duplicates, findDuplicatesSimple]);

  const deleteDuplicates = useCallback(async (paths: string[]) => {
    try {
      for (const path of paths) {
        await invoke('perform_file_operation', {
          operation: {
            operation: 'delete',
            source: path,
            destination: null
          }
        });
      }
      // Refresh duplicates list
      await findDuplicatesSimple();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete files');
      throw err;
    }
  }, [findDuplicatesSimple]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return {
    duplicates,
    summary,
    loading,
    error,
    findDuplicates,
    findDuplicatesSimple,
    deleteDuplicates,
    deleteDuplicatesBatch,
    formatBytes
  };
};