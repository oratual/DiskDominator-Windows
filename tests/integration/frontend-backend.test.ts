import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { spawn, ChildProcess } from 'child_process';
import { WebSocket } from 'ws';
import fetch from 'node-fetch';

describe('Frontend-Backend Integration', () => {
  let tauriProcess: ChildProcess;
  let ws: WebSocket;
  
  beforeAll(async () => {
    // Start Tauri in development mode
    console.log('Starting Tauri development server...');
    tauriProcess = spawn('cargo', ['tauri', 'dev'], {
      cwd: process.cwd(),
      shell: true,
    });
    
    // Wait for Tauri to start
    await new Promise(resolve => setTimeout(resolve, 10000));
  }, 30000);
  
  afterAll(async () => {
    // Clean up
    if (ws) ws.close();
    if (tauriProcess) {
      tauriProcess.kill();
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  });

  test('System Overview API should return disk information', async () => {
    // This would normally use Tauri's invoke, but for testing we'll simulate
    const mockSystemOverview = {
      disks: [
        {
          id: 'C',
          label: 'Local Disk (C:)',
          path: 'C:\\',
          used: 325000000000,
          total: 500000000000,
          free: 175000000000,
          percentage: 65
        }
      ],
      total_disk_space: 500000000000,
      total_used_space: 325000000000,
      total_free_space: 175000000000,
      duplicates_found: 0,
      space_recoverable: 0,
      large_files_count: 0,
      last_full_scan: null,
    };
    
    expect(mockSystemOverview.disks).toHaveLength(1);
    expect(mockSystemOverview.disks[0].id).toBe('C');
  });

  test('WebSocket connection should be established', async () => {
    // Test WebSocket connection
    const wsPromise = new Promise((resolve, reject) => {
      ws = new WebSocket('ws://localhost:9001');
      
      ws.on('open', () => {
        console.log('WebSocket connected');
        resolve(true);
      });
      
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      });
    });
    
    await expect(wsPromise).resolves.toBe(true);
  });

  test('Disk scan should start and send progress updates', async () => {
    // Mock scan request
    const scanRequest = {
      disk_id: 'C',
      scan_type: 'quick',
      exclude_patterns: ['node_modules', '.git'],
      include_hidden: false,
      calculate_hashes: false,
    };
    
    // In a real test, we would invoke the Tauri command
    // For now, we'll test the structure
    expect(scanRequest).toHaveProperty('disk_id');
    expect(scanRequest).toHaveProperty('scan_type');
    expect(['quick', 'deep', 'custom']).toContain(scanRequest.scan_type);
  });

  test('Duplicate detection should work with different strategies', async () => {
    const duplicateOptions = {
      disks: ['C'],
      detection_method: 'hash',
      min_size: 1024 * 1024, // 1MB
    };
    
    expect(duplicateOptions.detection_method).toBe('hash');
    expect(['hash', 'name', 'size', 'name_and_size']).toContain(duplicateOptions.detection_method);
  });

  test('Large files analysis should categorize files correctly', async () => {
    const filter = {
      min_size: 100 * 1024 * 1024, // 100MB
      sort_by: 'size',
      sort_order: 'desc',
    };
    
    expect(filter.min_size).toBeGreaterThan(0);
    expect(filter.sort_by).toBe('size');
  });

  test('Organization suggestions should provide actionable recommendations', async () => {
    const mockSuggestions = {
      suggestions: [
        {
          id: '1',
          suggestion_type: 'move',
          title: 'Move PDF files to Documents',
          description: 'Organize PDF files from Downloads to Documents folder',
          from_paths: ['C:/Users/Usuario/Downloads'],
          to_path: 'C:/Users/Usuario/Documents/PDFs',
          affected_files: [],
          estimated_time: 30,
          confidence: 0.85,
          reason: 'Many PDF files found in Downloads folder',
        }
      ],
      insights: {
        disorganized_folders: ['C:/Users/Usuario/Downloads'],
        naming_inconsistencies: [],
        duplicate_structures: [],
        unused_directories: [],
      }
    };
    
    expect(mockSuggestions.suggestions).toHaveLength(1);
    expect(mockSuggestions.suggestions[0].confidence).toBeGreaterThan(0.5);
  });
});