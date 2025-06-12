import { useEffect, useRef } from 'react';
import { useTauri } from './use-tauri';

export interface ScanProgressEvent {
  scan_id: string;
  current_path: string;
  files_scanned: number;
  bytes_scanned: number;
  percentage: number;
  estimated_remaining?: number;
}

export interface FileOperationEvent {
  operation_id: string;
  operation_type: string;
  source: string;
  destination?: string;
  success: boolean;
  error?: string;
}

export interface DuplicateFoundEvent {
  scan_id: string;
  hash: string;
  files: string[];
  total_size: number;
}

export interface AIAnalysisEvent {
  analysis_id: string;
  analysis_type: string;
  path: string;
  suggestions_count: number;
  confidence: number;
}

export interface ErrorEvent {
  error_type: string;
  message: string;
  context?: string;
}

interface EventHandlers {
  onScanProgress?: (event: ScanProgressEvent) => void;
  onFileOperationComplete?: (event: FileOperationEvent) => void;
  onDuplicateFound?: (event: DuplicateFoundEvent) => void;
  onAIAnalysisComplete?: (event: AIAnalysisEvent) => void;
  onError?: (event: ErrorEvent) => void;
}

export const useTauriEvents = (handlers: EventHandlers) => {
  const isTauri = useTauri();
  const unsubscribesRef = useRef<(() => void)[]>([]);

  useEffect(() => {
    if (!isTauri || typeof window === 'undefined' || !window.__TAURI__) {
      return;
    }

    const { event } = window.__TAURI__;
    const unsubscribes: (() => void)[] = [];

    const setupListener = async (
      eventName: string,
      handler?: (payload: any) => void
    ) => {
      if (handler) {
        const unlisten = await event.listen(eventName, (e: any) => {
          handler(e.payload.payload || e.payload);
        });
        unsubscribes.push(unlisten);
      }
    };

    // Setup all listeners
    Promise.all([
      setupListener('scan-progress', handlers.onScanProgress),
      setupListener('file-operation-complete', handlers.onFileOperationComplete),
      setupListener('duplicate-found', handlers.onDuplicateFound),
      setupListener('ai-analysis-complete', handlers.onAIAnalysisComplete),
      setupListener('app-error', handlers.onError),
    ]).then(() => {
      unsubscribesRef.current = unsubscribes;
    });

    // Cleanup
    return () => {
      unsubscribesRef.current.forEach(fn => fn());
      unsubscribesRef.current = [];
    };
  }, [isTauri, handlers]);

  // Emit custom events (for testing or manual triggers)
  const emit = async (eventName: string, payload: any) => {
    if (isTauri && window.__TAURI__) {
      await window.__TAURI__.event.emit(eventName, payload);
    }
  };

  return { emit };
};

// Example usage in a component:
/*
const MyComponent = () => {
  const [progress, setProgress] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);

  useTauriEvents({
    onScanProgress: (event) => {
      setProgress(event.percentage);
      console.log(`Scanning: ${event.current_path}`);
    },
    onError: (event) => {
      setErrors(prev => [...prev, event.message]);
    },
    onDuplicateFound: (event) => {
      console.log(`Found ${event.files.length} duplicates`);
    }
  });

  return (
    <div>
      <ProgressBar value={progress} />
      {errors.map((err, i) => (
        <Alert key={i} variant="error">{err}</Alert>
      ))}
    </div>
  );
};
*/