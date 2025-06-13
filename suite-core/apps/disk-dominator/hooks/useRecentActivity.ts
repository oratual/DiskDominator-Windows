import { useState, useEffect, useCallback } from 'react';
import { invoke } from './use-tauri';

export type ActivityType = 
  | 'scan_started'
  | 'scan_completed'
  | 'duplicates_found'
  | 'files_deleted'
  | 'files_moved'
  | 'disk_organized'
  | 'error_occurred';

export interface ActivityMetadata {
  size?: number;
  count?: number;
  duration?: number;
  error?: string;
}

export interface Activity {
  id: string;
  action: string;
  target: string;
  time: string;
  activity_type: ActivityType;
  status: string;
  metadata?: ActivityMetadata;
}

interface UseRecentActivityOptions {
  limit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const useRecentActivity = (options: UseRecentActivityOptions = {}) => {
  const { limit = 5, autoRefresh = true, refreshInterval = 30000 } = options;
  
  const [data, setData] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecentActivity = useCallback(async () => {
    try {
      const activities = await invoke<Activity[]>('get_recent_activity', { limit });
      setData(activities);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch recent activity');
      // In development, use mock data if Tauri is not available
      if (process.env.NODE_ENV === 'development') {
        setData([
          {
            id: '1',
            action: 'Escaneo completado',
            target: 'Disco C:',
            time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            activity_type: 'scan_completed',
            status: 'success',
            metadata: {
              size: 500_000_000_000,
              count: 150_000,
              duration: 180,
            },
          },
          {
            id: '2',
            action: 'Duplicados encontrados',
            target: '120 archivos (4.5 GB)',
            time: new Date(Date.now() - 2 * 60 * 60 * 1000 - 5 * 60 * 1000).toISOString(),
            activity_type: 'duplicates_found',
            status: 'success',
            metadata: {
              size: 4_500_000_000,
              count: 120,
            },
          },
          {
            id: '3',
            action: 'Archivos organizados',
            target: 'Documentos',
            time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            activity_type: 'disk_organized',
            status: 'success',
            metadata: {
              count: 450,
              duration: 45,
            },
          },
        ].slice(0, limit));
        setError(null);
      }
    } finally {
      setLoading(false);
    }
  }, [limit]);

  const refetch = useCallback(async () => {
    setLoading(true);
    await fetchRecentActivity();
  }, [fetchRecentActivity]);

  useEffect(() => {
    fetchRecentActivity();

    if (autoRefresh) {
      const interval = setInterval(fetchRecentActivity, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchRecentActivity, autoRefresh, refreshInterval]);

  // Format time for display
  const formatTime = (timeString: string): string => {
    const date = new Date(timeString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `Hace ${diffMinutes} minuto${diffMinutes !== 1 ? 's' : ''}`;
    } else if (diffHours < 24) {
      return `Hace ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
    } else {
      return `Hace ${diffDays} día${diffDays !== 1 ? 's' : ''}`;
    }
  };

  // Get icon component based on activity type
  const getActivityIcon = (type: ActivityType): string => {
    const iconMap: Record<ActivityType, string> = {
      scan_started: 'refresh',
      scan_completed: 'check-circle',
      duplicates_found: 'copy',
      files_deleted: 'trash',
      files_moved: 'move',
      disk_organized: 'folder',
      error_occurred: 'alert-circle',
    };
    return iconMap[type] || 'info';
  };

  // Get icon color based on activity type
  const getActivityColor = (type: ActivityType): string => {
    const colorMap: Record<ActivityType, string> = {
      scan_started: 'text-blue-500',
      scan_completed: 'text-green-500',
      duplicates_found: 'text-[#00b8d4]',
      files_deleted: 'text-red-500',
      files_moved: 'text-purple-500',
      disk_organized: 'text-orange-500',
      error_occurred: 'text-red-600',
    };
    return colorMap[type] || 'text-gray-500';
  };

  return {
    data,
    loading,
    error,
    refetch,
    formatTime,
    getActivityIcon,
    getActivityColor,
  };
};