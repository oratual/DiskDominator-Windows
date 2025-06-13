import { useState, useCallback, useEffect } from 'react';
import { invoke } from './use-tauri';
import { getWebSocketManager } from '@/lib/websocket-manager';

export interface LargeFileInfo {
  id: string;
  path: string;
  name: string;
  size: number;
  file_type: string;
  extension: string;
  created: number;
  modified: number;
  accessed: number;
  disk: string;
  compression_potential: number;
  last_opened?: number;
}

export interface LargeFileFilter {
  min_size?: number;
  max_size?: number;
  paths?: string[];
  file_types?: string[];
  extensions?: string[];
  sort_by?: string;
  sort_order?: string;
}

export interface SpaceAnalysis {
  total_size: number;
  file_count: number;
  by_type: Record<string, {
    size: number;
    count: number;
    percentage: number;
  }>;
  by_disk: Record<string, number>;
  size_distribution: {
    tiny: number;
    small: number;
    medium: number;
    large: number;
    huge: number;
    gigantic: number;
  };
}

export interface CompressionOptions {
  format: 'zip' | 'tar' | 'tar_gz' | 'seven_z';
  level: 'fast' | 'normal' | 'best';
  keep_original: boolean;
}

export interface CompressionResult {
  original_size: number;
  compressed_size: number;
  compression_ratio: number;
  output_path: string;
  time_taken: number;
}

export interface BatchDeleteResult {
  deleted: string[];
  failed: Array<{
    id: string;
    path: string;
    error: string;
  }>;
  space_freed: number;
}

export const useLargeFiles = () => {
  const [files, setFiles] = useState<LargeFileInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [spaceAnalysis, setSpaceAnalysis] = useState<SpaceAnalysis | null>(null);
  const wsManager = getWebSocketManager();

  const findLargeFiles = useCallback(async (filter: LargeFileFilter = {}) => {
    try {
      setLoading(true);
      setError(null);
      const result = await invoke<LargeFileInfo[]>('get_large_files', {
        filter: {
          min_size: filter.min_size || 100 * 1024 * 1024, // Default 100MB
          ...filter
        }
      });
      setFiles(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to find large files');
      // Mock data for development
      if (process.env.NODE_ENV === 'development') {
        setFiles([
          {
            id: '1',
            path: 'C:/Users/Usuario/Videos/movie.mp4',
            name: 'movie.mp4',
            size: 2500000000,
            file_type: 'video',
            extension: 'mp4',
            created: Date.now() - 86400000 * 30,
            modified: Date.now() - 86400000 * 7,
            accessed: Date.now() - 3600000,
            disk: 'C',
            compression_potential: 0.15,
          },
          {
            id: '2',
            path: 'D:/Backups/system-backup.zip',
            name: 'system-backup.zip',
            size: 5000000000,
            file_type: 'archive',
            extension: 'zip',
            created: Date.now() - 86400000 * 90,
            modified: Date.now() - 86400000 * 90,
            accessed: Date.now() - 86400000 * 30,
            disk: 'D',
            compression_potential: 0.02,
          },
        ]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const analyzeSpace = useCallback(async (paths?: string[]) => {
    try {
      setLoading(true);
      setError(null);
      const result = await invoke<SpaceAnalysis>('analyze_space_usage', {
        paths
      });
      setSpaceAnalysis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze space');
      // Mock data for development
      if (process.env.NODE_ENV === 'development') {
        setSpaceAnalysis({
          total_size: 75000000000,
          file_count: 250,
          by_type: {
            video: { size: 35000000000, count: 45, percentage: 46.7 },
            archive: { size: 20000000000, count: 30, percentage: 26.7 },
            documents: { size: 10000000000, count: 120, percentage: 13.3 },
            images: { size: 8000000000, count: 40, percentage: 10.7 },
            other: { size: 2000000000, count: 15, percentage: 2.6 },
          },
          by_disk: {
            'C': 45000000000,
            'D': 30000000000,
          },
          size_distribution: {
            tiny: 0,
            small: 0,
            medium: 50,
            large: 120,
            huge: 65,
            gigantic: 15,
          },
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const compressFile = useCallback(async (filePath: string, options: CompressionOptions) => {
    try {
      const result = await invoke<CompressionResult>('compress_file', {
        file_path: filePath,
        options
      });
      // Refresh files list after compression
      if (!options.keep_original) {
        setFiles(prev => prev.filter(f => f.path !== filePath));
      }
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to compress file');
      throw err;
    }
  }, []);

  const deleteFiles = useCallback(async (fileIds: string[], moveToTrash: boolean = true) => {
    try {
      const result = await invoke<BatchDeleteResult>('delete_large_files_batch', {
        file_ids: fileIds,
        move_to_trash: moveToTrash
      });
      // Remove deleted files from local state
      setFiles(prev => prev.filter(f => !result.deleted.includes(f.id)));
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete files');
      throw err;
    }
  }, []);

  const previewFile = useCallback(async (filePath: string) => {
    try {
      const result = await invoke('generate_file_preview', {
        file_path: filePath
      });
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate preview');
      throw err;
    }
  }, []);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string): string => {
    const iconMap: Record<string, string> = {
      image: '🖼️',
      video: '🎬',
      audio: '🎵',
      document: '📑',
      spreadsheet: '📊',
      presentation: '📈',
      archive: '📦',
      executable: '⚙️',
      code: '💻',
      config: '⚙️',
      database: '🗄️',
      log: '📋',
      markdown: '📝',
      web: '🌐',
      text: '📃',
      other: '📄'
    };
    
    return iconMap[fileType] || '📄';
  };

  const getCompressionColor = (potential: number): string => {
    if (potential >= 0.6) return 'text-green-600 dark:text-green-400';
    if (potential >= 0.4) return 'text-yellow-600 dark:text-yellow-400';
    if (potential >= 0.2) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getSizeCategory = (size: number): string => {
    const mb = 1024 * 1024;
    const gb = mb * 1024;
    
    if (size < mb) return 'tiny';
    if (size < 10 * mb) return 'small';
    if (size < 100 * mb) return 'medium';
    if (size < gb) return 'large';
    if (size < 10 * gb) return 'huge';
    return 'gigantic';
  };

  // Listen for real-time updates
  useEffect(() => {
    const unsubscribe = wsManager.subscribe('large-files-update', (data) => {
      if (data.files) {
        setFiles(data.files);
      }
      if (data.analysis) {
        setSpaceAnalysis(data.analysis);
      }
    });

    return () => unsubscribe();
  }, [wsManager]);

  return {
    files,
    loading,
    error,
    spaceAnalysis,
    findLargeFiles,
    analyzeSpace,
    compressFile,
    deleteFiles,
    previewFile,
    formatBytes,
    getFileIcon,
    getCompressionColor,
    getSizeCategory
  };
};