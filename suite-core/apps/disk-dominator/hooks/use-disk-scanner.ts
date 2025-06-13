import { useState, useCallback, useEffect, useRef } from 'react';
import { invoke } from './use-tauri';
import { listen, UnlistenFn } from '@tauri-apps/api/event';

export interface ScanProgress {
  scan_id: string;
  disk_id: string;
  scan_type: string;
  progress: number;
  quick_scan_progress?: number;
  deep_scan_progress?: number;
  remaining_time: number;
  files_scanned: number;
  total_files: number;
  bytes_scanned: number;
  total_bytes: number;
  current_path: string;
  scan_status: string;
  errors: string[];
}

export interface ScanRequest {
  disk_id: string;
  scan_type: 'quick' | 'deep' | 'custom';
  exclude_patterns?: string[];
  include_hidden?: boolean;
  calculate_hashes?: boolean;
}

export interface ScanResponse {
  session_id: string;
  status: string;
  message: string;
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

export interface DuplicateGroup {
  hash: string;
  files: FileInfo[];
  total_size: number;
  potential_savings: number;
}

export interface ScanResults {
  files: FileInfo[];
  duplicate_groups: DuplicateGroup[];
  large_files: FileInfo[];
  total_files: number;
  total_size: number;
  scan_duration: number;
}

export interface ScanSession {
  id: string;
  disk_path: string;
  scan_type: string;
  status: 'created' | 'running' | 'paused' | 'completed' | 'error' | 'cancelled';
  created_at: string;
  started_at?: string;
  paused_at?: string;
  completed_at?: string;
  progress: {
    quick_scan: ScanProgress;
    deep_scan: ScanProgress;
    overall_progress: number;
    current_phase: string;
    estimated_total_time: number;
    elapsed_time: number;
  };
  results?: ScanResults;
}

export const useDiskScanner = () => {
  const [scanning, setScanning] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [progress, setProgress] = useState<ScanProgress | null>(null);
  const [session, setSession] = useState<ScanSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const unlistenRef = useRef<UnlistenFn | null>(null);

  // Listen for WebSocket progress updates
  useEffect(() => {
    const setupListener = async () => {
      if (sessionId) {
        const unlisten = await listen<ScanProgress>('scan-progress', (event) => {
          if (event.payload.scan_id === sessionId) {
            setProgress(event.payload);
          }
        });
        unlistenRef.current = unlisten;
      }
    };

    setupListener();

    return () => {
      if (unlistenRef.current) {
        unlistenRef.current();
        unlistenRef.current = null;
      }
    };
  }, [sessionId]);

  const startScan = useCallback(async (diskId: string, scanType: 'quick' | 'deep' | 'custom', options?: Partial<ScanRequest>) => {
    setScanning(true);
    setError(null);
    setProgress(null);

    try {
      const request: ScanRequest = {
        disk_id: diskId,
        scan_type: scanType,
        exclude_patterns: options?.exclude_patterns,
        include_hidden: options?.include_hidden,
        calculate_hashes: options?.calculate_hashes,
      };

      const response = await invoke<ScanResponse>('scan_disk_new', { 
        scan_request: request 
      });
      
      setSessionId(response.session_id);
      
      // Poll for session updates
      const pollInterval = setInterval(async () => {
        try {
          const sessionData = await invoke<ScanSession>('get_scan_session', { 
            session_id: response.session_id 
          });
          setSession(sessionData);
          
          if (sessionData.status === 'completed' || sessionData.status === 'error' || sessionData.status === 'cancelled') {
            clearInterval(pollInterval);
            setScanning(false);
          }
        } catch (err) {
          console.error('Failed to get session:', err);
        }
      }, 1000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scan failed');
      setScanning(false);
    }
  }, []);

  const pauseScan = useCallback(async () => {
    if (sessionId) {
      try {
        await invoke('pause_scan', { session_id: sessionId });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to pause scan');
      }
    }
  }, [sessionId]);

  const resumeScan = useCallback(async () => {
    if (sessionId) {
      try {
        await invoke('resume_scan', { session_id: sessionId });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to resume scan');
      }
    }
  }, [sessionId]);

  const cancelScan = useCallback(async () => {
    if (sessionId) {
      try {
        await invoke('cancel_scan', { session_id: sessionId });
        setScanning(false);
        setProgress(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to cancel scan');
      }
    }
  }, [sessionId]);

  return {
    scanning,
    sessionId,
    progress,
    session,
    error,
    startScan,
    pauseScan,
    resumeScan,
    cancelScan,
  };
};