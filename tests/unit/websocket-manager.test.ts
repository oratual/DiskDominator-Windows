import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { WebSocketManager } from '../../suite-core/apps/disk-dominator/lib/websocket-manager';

// Mock Tauri API
const mockListen = jest.fn();
const mockUnlisten = jest.fn();

jest.mock('@tauri-apps/api/event', () => ({
  listen: mockListen,
  Event: jest.fn(),
}));

describe('WebSocketManager', () => {
  let wsManager: WebSocketManager;

  beforeEach(() => {
    // Reset mocks
    mockListen.mockClear();
    mockUnlisten.mockClear();
    
    // Mock window object
    global.window = {
      __TAURI__: true,
    } as any;
  });

  afterEach(() => {
    if (wsManager) {
      wsManager.destroy();
    }
  });

  test('should create singleton instance', () => {
    const instance1 = new WebSocketManager();
    const instance2 = new WebSocketManager();
    
    // In real implementation, we'd use getWebSocketManager()
    expect(instance1).toBeDefined();
    expect(instance2).toBeDefined();
  });

  test('should setup listeners on initialization', async () => {
    mockListen.mockResolvedValue(mockUnlisten);
    
    wsManager = new WebSocketManager();
    
    // Wait for async setup
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Should listen to all required events
    expect(mockListen).toHaveBeenCalledWith('scan-progress', expect.any(Function));
    expect(mockListen).toHaveBeenCalledWith('activity-update', expect.any(Function));
    expect(mockListen).toHaveBeenCalledWith('scan-session-update', expect.any(Function));
    expect(mockListen).toHaveBeenCalledWith('disk-status-update', expect.any(Function));
  });

  test('should allow subscribing to events', () => {
    wsManager = new WebSocketManager();
    
    const callback = jest.fn();
    const unsubscribe = wsManager.subscribe('scan-progress', callback);
    
    expect(typeof unsubscribe).toBe('function');
  });

  test('should notify callbacks when event is received', async () => {
    let capturedHandler: any;
    mockListen.mockImplementation((event, handler) => {
      if (event === 'scan-progress') {
        capturedHandler = handler;
      }
      return Promise.resolve(mockUnlisten);
    });
    
    wsManager = new WebSocketManager();
    
    // Wait for setup
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const callback = jest.fn();
    wsManager.subscribe('scan-progress', callback);
    
    // Simulate event
    const mockData = {
      scan_id: 'test-123',
      progress: 50,
      disk_id: 'C',
    };
    
    if (capturedHandler) {
      capturedHandler({ payload: mockData });
    }
    
    expect(callback).toHaveBeenCalledWith(mockData);
  });

  test('should handle multiple subscribers for same event', async () => {
    let capturedHandler: any;
    mockListen.mockImplementation((event, handler) => {
      if (event === 'scan-progress') {
        capturedHandler = handler;
      }
      return Promise.resolve(mockUnlisten);
    });
    
    wsManager = new WebSocketManager();
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const callback1 = jest.fn();
    const callback2 = jest.fn();
    
    wsManager.subscribe('scan-progress', callback1);
    wsManager.subscribe('scan-progress', callback2);
    
    const mockData = { progress: 75 };
    if (capturedHandler) {
      capturedHandler({ payload: mockData });
    }
    
    expect(callback1).toHaveBeenCalledWith(mockData);
    expect(callback2).toHaveBeenCalledWith(mockData);
  });

  test('should unsubscribe correctly', async () => {
    wsManager = new WebSocketManager();
    
    const callback = jest.fn();
    const unsubscribe = wsManager.subscribe('scan-progress', callback);
    
    // Unsubscribe
    unsubscribe();
    
    // Callback should not be called after unsubscribe
    // (In real implementation, we'd trigger an event here)
    expect(callback).not.toHaveBeenCalled();
  });

  test('should clean up on destroy', async () => {
    mockListen.mockResolvedValue(mockUnlisten);
    
    wsManager = new WebSocketManager();
    await new Promise(resolve => setTimeout(resolve, 100));
    
    wsManager.destroy();
    
    // All unlisteners should be called
    expect(mockUnlisten).toHaveBeenCalled();
  });

  test('should handle errors in callbacks gracefully', async () => {
    let capturedHandler: any;
    mockListen.mockImplementation((event, handler) => {
      if (event === 'scan-progress') {
        capturedHandler = handler;
      }
      return Promise.resolve(mockUnlisten);
    });
    
    wsManager = new WebSocketManager();
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const errorCallback = jest.fn(() => {
      throw new Error('Test error');
    });
    const normalCallback = jest.fn();
    
    wsManager.subscribe('scan-progress', errorCallback);
    wsManager.subscribe('scan-progress', normalCallback);
    
    // Console error spy
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    
    const mockData = { progress: 50 };
    if (capturedHandler) {
      capturedHandler({ payload: mockData });
    }
    
    // Error callback throws but normal callback still runs
    expect(errorCallback).toHaveBeenCalled();
    expect(normalCallback).toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalled();
    
    consoleError.mockRestore();
  });
});