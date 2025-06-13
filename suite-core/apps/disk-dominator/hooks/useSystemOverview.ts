import { useState, useEffect, useCallback } from 'react';
import { invoke } from './use-tauri';

export interface DiskSummary {
  id: string;
  label: string;
  path: string;
  used: number;
  total: number;
  free: number;
  percentage: number;
  file_system?: string;
  last_scanned?: string;
}

export interface SystemOverview {
  disks: DiskSummary[];
  total_disk_space: number;
  total_used_space: number;
  total_free_space: number;
  duplicates_found: number;
  space_recoverable: number;
  large_files_count: number;
  last_full_scan?: string;
}

export const useSystemOverview = (autoRefresh: boolean = true, refreshInterval: number = 30000) => {
  const [data, setData] = useState<SystemOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSystemOverview = useCallback(async () => {
    try {
      const overview = await invoke<SystemOverview>('get_system_overview');
      setData(overview);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch system overview');
      // In development, use mock data if Tauri is not available
      if (process.env.NODE_ENV === 'development') {
        setData({
          disks: [
            { id: 'C', label: 'Local Disk (C:)', path: 'C:\\', used: 325_000_000_000, total: 500_000_000_000, free: 175_000_000_000, percentage: 65 },
            { id: 'D', label: 'Data (D:)', path: 'D:\\', used: 750_000_000_000, total: 1_000_000_000_000, free: 250_000_000_000, percentage: 75 },
            { id: 'E', label: 'Backup (E:)', path: 'E:\\', used: 1_200_000_000_000, total: 2_000_000_000_000, free: 800_000_000_000, percentage: 60 },
            { id: 'J', label: 'External (J:)', path: 'J:\\', used: 400_000_000_000, total: 1_000_000_000_000, free: 600_000_000_000, percentage: 40 },
          ],
          total_disk_space: 4_500_000_000_000,
          total_used_space: 2_675_000_000_000,
          total_free_space: 1_825_000_000_000,
          duplicates_found: 120,
          space_recoverable: 4_500_000_000,
          large_files_count: 45,
          last_full_scan: new Date().toISOString(),
        });
        setError(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    await fetchSystemOverview();
  }, [fetchSystemOverview]);

  useEffect(() => {
    fetchSystemOverview();

    if (autoRefresh) {
      const interval = setInterval(fetchSystemOverview, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchSystemOverview, autoRefresh, refreshInterval]);

  return {
    data,
    loading,
    error,
    refresh,
  };
};