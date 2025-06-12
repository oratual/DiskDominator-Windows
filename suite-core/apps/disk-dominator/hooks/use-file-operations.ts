import { useState, useCallback } from 'react';
import { invoke } from './use-tauri';

export interface FileOperation {
  operation: 'move' | 'delete' | 'rename';
  source: string;
  destination?: string;
}

export interface FileOperationResult {
  success: boolean;
  error?: string;
}

export const useFileOperations = () => {
  const [operating, setOperating] = useState(false);
  const [lastOperation, setLastOperation] = useState<FileOperation | null>(null);

  const performOperation = useCallback(async (operation: FileOperation): Promise<FileOperationResult> => {
    setOperating(true);
    setLastOperation(operation);

    try {
      const success = await invoke<boolean>('perform_file_operation', { operation });
      return { success };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Operation failed',
      };
    } finally {
      setOperating(false);
    }
  }, []);

  const moveFile = useCallback(async (source: string, destination: string) => {
    return performOperation({
      operation: 'move',
      source,
      destination,
    });
  }, [performOperation]);

  const deleteFile = useCallback(async (source: string) => {
    return performOperation({
      operation: 'delete',
      source,
    });
  }, [performOperation]);

  const renameFile = useCallback(async (source: string, newName: string) => {
    return performOperation({
      operation: 'rename',
      source,
      destination: newName,
    });
  }, [performOperation]);

  return {
    operating,
    lastOperation,
    performOperation,
    moveFile,
    deleteFile,
    renameFile,
  };
};