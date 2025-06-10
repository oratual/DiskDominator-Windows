import { useEffect, useState } from 'react';

// Check if we're running in Tauri
export const useTauri = () => {
  const [isTauri, setIsTauri] = useState(false);

  useEffect(() => {
    setIsTauri(typeof window !== 'undefined' && '__TAURI__' in window);
  }, []);

  return isTauri;
};

// Tauri API wrapper
export const invoke = async <T = any>(
  cmd: string,
  args?: Record<string, any>
): Promise<T> => {
  if (typeof window !== 'undefined' && '__TAURI__' in window) {
    const { invoke } = window.__TAURI__.tauri;
    return invoke<T>(cmd, args);
  }
  
  // Fallback for development without Tauri
  console.warn(`Tauri not available, mocking command: ${cmd}`);
  return mockCommand<T>(cmd, args);
};

// Mock commands for development
async function mockCommand<T>(cmd: string, args?: Record<string, any>): Promise<T> {
  // Add mock implementations for each command
  switch (cmd) {
    case 'get_disk_info':
      return [
        {
          name: 'Local Disk (C:)',
          mount_point: 'C:\\',
          total_space: 500000000000,
          available_space: 100000000000,
          used_space: 400000000000,
          file_system: 'NTFS',
        }
      ] as any;
      
    case 'scan_disk':
      return [] as any;
      
    case 'find_duplicates':
      return [] as any;
      
    default:
      console.warn(`No mock implementation for command: ${cmd}`);
      return {} as any;
  }
}