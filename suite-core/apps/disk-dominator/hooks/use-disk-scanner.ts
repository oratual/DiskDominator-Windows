import { useState, useCallback } from 'react';
import { invoke } from './use-tauri';

export interface ScanProgress {
  current_path: string;
  files_scanned: number;
  bytes_scanned: number;
  percentage: number;
}

export interface ScanOptions {
  scan_type: 'Quick' | 'Deep' | 'Custom';
  exclude_patterns: string[];
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

export const useDiskScanner = () => {
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState<ScanProgress | null>(null);
  const [results, setResults] = useState<FileInfo[]>([]);
  const [error, setError] = useState<string | null>(null);

  const startScan = useCallback(async (path: string, options: ScanOptions) => {
    setScanning(true);
    setError(null);
    setProgress({
      current_path: path,
      files_scanned: 0,
      bytes_scanned: 0,
      percentage: 0,
    });

    try {
      const files = await invoke<FileInfo[]>('scan_disk', { path, options });
      setResults(files);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scan failed');
    } finally {
      setScanning(false);
      setProgress(null);
    }
  }, []);

  const cancelScan = useCallback(() => {
    // In a real implementation, this would send a cancel command to Tauri
    setScanning(false);
    setProgress(null);
  }, []);

  return {
    scanning,
    progress,
    results,
    error,
    startScan,
    cancelScan,
  };
};