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