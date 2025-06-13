import { listen, Event, UnlistenFn } from '@tauri-apps/api/event';

export interface WebSocketMessage {
  type: string;
  payload: any;
}

export interface ScanProgressMessage {
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

export interface ActivityMessage {
  id: string;
  action: string;
  target: string;
  time: string;
  activity_type: string;
  status: string;
  metadata?: any;
}

export class WebSocketManager {
  private listeners: Map<string, UnlistenFn> = new Map();
  private callbacks: Map<string, Set<(data: any) => void>> = new Map();
  
  constructor() {
    // Only setup listeners in browser environment
    if (typeof window !== 'undefined') {
      this.setupListeners();
    }
  }

  private async setupListeners() {
    // Listen for scan progress updates
    const unlistenProgress = await listen<ScanProgressMessage>('scan-progress', (event: Event<ScanProgressMessage>) => {
      this.notifyCallbacks('scan-progress', event.payload);
    });
    this.listeners.set('scan-progress', unlistenProgress);

    // Listen for activity updates
    const unlistenActivity = await listen<ActivityMessage>('activity-update', (event: Event<ActivityMessage>) => {
      this.notifyCallbacks('activity-update', event.payload);
    });
    this.listeners.set('activity-update', unlistenActivity);

    // Listen for scan session updates
    const unlistenSession = await listen<any>('scan-session-update', (event: Event<any>) => {
      this.notifyCallbacks('scan-session-update', event.payload);
    });
    this.listeners.set('scan-session-update', unlistenSession);

    // Listen for disk status updates
    const unlistenDiskStatus = await listen<any>('disk-status-update', (event: Event<any>) => {
      this.notifyCallbacks('disk-status-update', event.payload);
    });
    this.listeners.set('disk-status-update', unlistenDiskStatus);
  }

  public subscribe(event: string, callback: (data: any) => void): () => void {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, new Set());
    }
    this.callbacks.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.callbacks.get(event);
      if (callbacks) {
        callbacks.delete(callback);
      }
    };
  }

  private notifyCallbacks(event: string, data: any) {
    const callbacks = this.callbacks.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in WebSocket callback for event ${event}:`, error);
        }
      });
    }
  }

  public destroy() {
    // Clean up all listeners
    this.listeners.forEach(unlisten => {
      unlisten();
    });
    this.listeners.clear();
    this.callbacks.clear();
  }
}

// Singleton instance
let webSocketManager: WebSocketManager | null = null;

export function getWebSocketManager(): WebSocketManager {
  // Only create instance in browser environment
  if (typeof window !== 'undefined') {
    if (!webSocketManager) {
      webSocketManager = new WebSocketManager();
    }
    return webSocketManager;
  }
  
  // Return a mock for SSR
  return {
    subscribe: () => () => {},
    destroy: () => {},
  } as any;
}

export function destroyWebSocketManager() {
  if (webSocketManager) {
    webSocketManager.destroy();
    webSocketManager = null;
  }
}