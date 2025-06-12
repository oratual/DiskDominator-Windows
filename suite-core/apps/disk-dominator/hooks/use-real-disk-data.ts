import { useState, useCallback, useEffect } from 'react';
import { invoke } from './use-tauri';

export interface DiskInfo {
  name: string;
  mount_point: string;
  total_space: number;
  available_space: number;
  used_space: number;
  file_system: string;
}

export interface ScanProgress {
  total_files: number;
  processed_files: number;
  total_size: number;
  current_path: string;
  errors: string[];
}

export interface ScanOptions {
  scan_type: 'Quick' | 'Deep' | 'Custom';
  exclude_patterns: string[];
}

export const useRealDiskData = () => {
  const [disks, setDisks] = useState<DiskInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState<Map<string, ScanProgress>>(new Map());
  const [scanningDisks, setScanningDisks] = useState<Set<string>>(new Set());

  // Load disk information on mount
  useEffect(() => {
    loadDisks();
  }, []);

  const loadDisks = useCallback(async () => {
    try {
      setLoading(true);
      const diskList = await invoke<DiskInfo[]>('get_disk_info');
      setDisks(diskList);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load disks');
    } finally {
      setLoading(false);
    }
  }, []);

  const startScan = useCallback(async (diskPath: string, scanType: 'Quick' | 'Deep' = 'Quick') => {
    setScanningDisks(prev => new Set(prev).add(diskPath));
    
    const options: ScanOptions = {
      scan_type: scanType,
      exclude_patterns: [
        'node_modules',
        '.git',
        '*.tmp',
        '*.cache',
        'System Volume Information',
        '$RECYCLE.BIN'
      ]
    };

    try {
      // Start progress monitoring
      const progressInterval = setInterval(async () => {
        try {
          const progress = await invoke<ScanProgress>('get_scan_progress');
          setScanProgress(prev => new Map(prev).set(diskPath, progress));
          
          // Check if scan is complete
          if (progress.processed_files === progress.total_files && progress.total_files > 0) {
            clearInterval(progressInterval);
            setScanningDisks(prev => {
              const next = new Set(prev);
              next.delete(diskPath);
              return next;
            });
          }
        } catch (err) {
          console.error('Failed to get scan progress:', err);
        }
      }, 500);

      // Start the actual scan
      await invoke('scan_disk', { 
        path: diskPath, 
        options 
      });

      // Clean up
      clearInterval(progressInterval);
      setScanningDisks(prev => {
        const next = new Set(prev);
        next.delete(diskPath);
        return next;
      });
    } catch (err) {
      console.error('Scan failed:', err);
      setScanningDisks(prev => {
        const next = new Set(prev);
        next.delete(diskPath);
        return next;
      });
    }
  }, []);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return {
    disks,
    loading,
    error,
    scanProgress,
    scanningDisks,
    loadDisks,
    startScan,
    formatBytes
  };
};