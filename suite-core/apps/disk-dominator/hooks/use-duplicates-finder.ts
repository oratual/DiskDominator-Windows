import { useState, useCallback } from 'react';
import { invoke } from './use-tauri';

export interface DuplicateGroup {
  hash: string;
  files: FileInfo[];
  total_size: number;
  potential_savings: number;
}

export interface FileInfo {
  path: string;
  name: string;
  size: number;
  modified: string;
  created: string;
  is_directory: boolean;
  extension?: string;
  hash?: string;
}

export const useDuplicatesFinder = () => {
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const findDuplicates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await invoke<DuplicateGroup[]>('find_duplicates');
      setDuplicates(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to find duplicates');
    } finally {
      setLoading(false);
    }
  }, []);

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
      await findDuplicates();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete files');
    }
  }, [findDuplicates]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return {
    duplicates,
    loading,
    error,
    findDuplicates,
    deleteDuplicates,
    formatBytes
  };
};