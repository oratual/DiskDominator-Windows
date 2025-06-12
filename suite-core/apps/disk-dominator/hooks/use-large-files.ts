import { useState, useCallback } from 'react';
import { invoke } from './use-tauri';

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

export const useLargeFiles = () => {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const findLargeFiles = useCallback(async (minSizeMB: number = 100) => {
    try {
      setLoading(true);
      setError(null);
      const result = await invoke<FileInfo[]>('get_large_files', {
        min_size_mb: minSizeMB
      });
      setFiles(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to find large files');
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteFile = useCallback(async (path: string) => {
    try {
      await invoke('perform_file_operation', {
        operation: {
          operation: 'delete',
          source: path,
          destination: null
        }
      });
      // Remove from local state
      setFiles(prev => prev.filter(f => f.path !== path));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete file');
    }
  }, []);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (extension?: string): string => {
    if (!extension) return '📄';
    
    const iconMap: Record<string, string> = {
      // Images
      jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️', svg: '🖼️',
      // Videos
      mp4: '🎬', avi: '🎬', mkv: '🎬', mov: '🎬',
      // Audio
      mp3: '🎵', wav: '🎵', flac: '🎵',
      // Documents
      pdf: '📑', doc: '📝', docx: '📝', txt: '📃',
      // Archives
      zip: '📦', rar: '📦', '7z': '📦',
      // Code
      js: '💻', ts: '💻', py: '🐍', rs: '🦀',
    };
    
    return iconMap[extension.toLowerCase()] || '📄';
  };

  return {
    files,
    loading,
    error,
    findLargeFiles,
    deleteFile,
    formatBytes,
    getFileIcon
  };
};