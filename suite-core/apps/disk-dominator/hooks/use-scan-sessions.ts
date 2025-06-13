import { useState, useCallback, useEffect } from 'react';
import { invoke } from './use-tauri';

export interface ScanSession {
  id: string;
  disk_path: string;
  scan_type: 'Quick' | 'Deep' | 'Custom';
  config: ScanConfig;
  status: ScanSessionStatus;
  created_at: string;
  started_at?: string;
  paused_at?: string;
  completed_at?: string;
  progress: DualScanProgress;
  results?: ScanResults;
}

export interface ScanConfig {
  exclude_patterns: string[];
  include_hidden: boolean;
  follow_symlinks: boolean;
  max_depth?: number;
  min_file_size?: number;
  max_file_size?: number;
  calculate_hashes: boolean;
  quick_hash_threshold: number;
}

export type ScanSessionStatus = 
  | 'Created'
  | 'Running'
  | 'Paused'
  | 'Completed'
  | { Error: string }
  | 'Cancelled';

export interface DualScanProgress {
  quick_scan: ScanProgress;
  deep_scan: ScanProgress;
  overall_progress: number;
  current_phase: string;
  estimated_total_time: number;
  elapsed_time: number;
}

export interface ScanProgress {
  total_files: number;
  processed_files: number;
  total_size: number;
  current_path: string;
  errors: string[];
}

export interface ScanResults {
  files: any[]; // FileInfo[]
  duplicate_groups: any[]; // DuplicateGroup[]
  large_files: any[]; // FileInfo[]
  total_files: number;
  total_size: number;
  scan_duration: number;
}

export const useScanSessions = () => {
  const [sessions, setSessions] = useState<Map<string, ScanSession>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create a new scan session
  const createScanSession = useCallback(async (
    diskPath: string,
    scanType: 'quick' | 'deep' | 'custom',
    excludePatterns: string[] = []
  ): Promise<string | null> => {
    try {
      setLoading(true);
      const sessionId = await invoke<string>('create_scan_session', {
        disk_path: diskPath,
        scan_type: scanType,
        exclude_patterns: excludePatterns
      });
      
      // Refresh sessions to get the new one
      await refreshSessions();
      setError(null);
      return sessionId;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create scan session';
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Start a scan session
  const startScanSession = useCallback(async (sessionId: string): Promise<boolean> => {
    try {
      setLoading(true);
      await invoke('start_scan_session', { session_id: sessionId });
      await refreshSessions();
      setError(null);
      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to start scan session';
      setError(errorMsg);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Pause a scan session
  const pauseScanSession = useCallback(async (sessionId: string): Promise<boolean> => {
    try {
      await invoke('pause_scan_session', { session_id: sessionId });
      await refreshSessions();
      setError(null);
      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to pause scan session';
      setError(errorMsg);
      return false;
    }
  }, []);

  // Resume a scan session
  const resumeScanSession = useCallback(async (sessionId: string): Promise<boolean> => {
    try {
      await invoke('resume_scan_session', { session_id: sessionId });
      await refreshSessions();
      setError(null);
      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to resume scan session';
      setError(errorMsg);
      return false;
    }
  }, []);

  // Cancel a scan session
  const cancelScanSession = useCallback(async (sessionId: string): Promise<boolean> => {
    try {
      await invoke('cancel_scan_session', { session_id: sessionId });
      await refreshSessions();
      setError(null);
      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to cancel scan session';
      setError(errorMsg);
      return false;
    }
  }, []);

  // Get a specific session
  const getSession = useCallback(async (sessionId: string): Promise<ScanSession | null> => {
    try {
      const session = await invoke<ScanSession | null>('get_scan_session', { session_id: sessionId });
      if (session) {
        setSessions(prev => new Map(prev).set(sessionId, session));
      }
      return session;
    } catch (err) {
      console.error('Failed to get scan session:', err);
      return null;
    }
  }, []);

  // Refresh all active sessions
  const refreshSessions = useCallback(async () => {
    try {
      const activeSessions = await invoke<Record<string, ScanSession>>('get_active_scan_sessions');
      const sessionMap = new Map(Object.entries(activeSessions));
      setSessions(sessionMap);
    } catch (err) {
      console.error('Failed to refresh scan sessions:', err);
    }
  }, []);

  // Auto-refresh sessions periodically
  useEffect(() => {
    const interval = setInterval(refreshSessions, 2000); // Refresh every 2 seconds
    return () => clearInterval(interval);
  }, [refreshSessions]);

  // Initial load
  useEffect(() => {
    refreshSessions();
  }, [refreshSessions]);

  // Helper functions
  const getSessionStatus = (session: ScanSession): string => {
    if (typeof session.status === 'string') {
      return session.status;
    }
    if (typeof session.status === 'object' && 'Error' in session.status) {
      return `Error: ${session.status.Error}`;
    }
    return 'Unknown';
  };

  const isSessionRunning = (session: ScanSession): boolean => {
    return getSessionStatus(session) === 'Running';
  };

  const isSessionPaused = (session: ScanSession): boolean => {
    return getSessionStatus(session) === 'Paused';
  };

  const isSessionCompleted = (session: ScanSession): boolean => {
    return getSessionStatus(session) === 'Completed';
  };

  const canPauseSession = (session: ScanSession): boolean => {
    return isSessionRunning(session);
  };

  const canResumeSession = (session: ScanSession): boolean => {
    return isSessionPaused(session);
  };

  const formatProgress = (progress: number): string => {
    return `${Math.round(progress)}%`;
  };

  const formatTimeRemaining = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  };

  return {
    sessions,
    loading,
    error,
    createScanSession,
    startScanSession,
    pauseScanSession,
    resumeScanSession,
    cancelScanSession,
    getSession,
    refreshSessions,
    // Helper functions
    getSessionStatus,
    isSessionRunning,
    isSessionPaused,
    isSessionCompleted,
    canPauseSession,
    canResumeSession,
    formatProgress,
    formatTimeRemaining,
  };
};