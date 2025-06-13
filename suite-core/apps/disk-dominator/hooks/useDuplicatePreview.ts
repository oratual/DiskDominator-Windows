import { useState, useCallback } from 'react';
import { invoke } from './use-tauri';

export interface FilePreview {
  path: string;
  size: number;
  type: 'image' | 'video' | 'document' | 'other';
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
    pages?: number;
  };
  thumbnail?: string;
  content?: string;
}

export const useDuplicatePreview = () => {
  const [preview, setPreview] = useState<FilePreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPreview = useCallback(async (filePath: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await invoke<Record<string, any>>('preview_duplicate', {
        filePath,
      });
      
      // Convert the result to FilePreview format
      const preview: FilePreview = {
        path: result.path as string,
        size: result.size as number,
        type: result.type as FilePreview['type'],
        metadata: result.metadata,
        thumbnail: result.thumbnail,
        content: result.content,
      };
      
      setPreview(preview);
      return preview;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load preview';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearPreview = useCallback(() => {
    setPreview(null);
    setError(null);
  }, []);

  const compareFiles = useCallback(async (file1Path: string, file2Path: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Load both previews in parallel
      const [preview1, preview2] = await Promise.all([
        invoke<Record<string, any>>('preview_duplicate', { filePath: file1Path }),
        invoke<Record<string, any>>('preview_duplicate', { filePath: file2Path }),
      ]);
      
      return {
        file1: {
          path: preview1.path as string,
          size: preview1.size as number,
          type: preview1.type as FilePreview['type'],
          metadata: preview1.metadata,
          thumbnail: preview1.thumbnail,
          content: preview1.content,
        },
        file2: {
          path: preview2.path as string,
          size: preview2.size as number,
          type: preview2.type as FilePreview['type'],
          metadata: preview2.metadata,
          thumbnail: preview2.thumbnail,
          content: preview2.content,
        },
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to compare files';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const openInExplorer = useCallback(async (filePath: string) => {
    try {
      // Use Tauri's shell API to open the file location
      const { shell } = await import('@tauri-apps/api');
      
      // Get the directory path
      const dirPath = filePath.substring(0, filePath.lastIndexOf('/') || filePath.lastIndexOf('\\'));
      
      // Open the directory in the file explorer
      await shell.open(dirPath);
    } catch (err) {
      console.error('Failed to open in explorer:', err);
      throw err;
    }
  }, []);

  const openFile = useCallback(async (filePath: string) => {
    try {
      // Use Tauri's shell API to open the file with default application
      const { shell } = await import('@tauri-apps/api');
      await shell.open(filePath);
    } catch (err) {
      console.error('Failed to open file:', err);
      throw err;
    }
  }, []);

  return {
    preview,
    loading,
    error,
    loadPreview,
    clearPreview,
    compareFiles,
    openInExplorer,
    openFile,
  };
};