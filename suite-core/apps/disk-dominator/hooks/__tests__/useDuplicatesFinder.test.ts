import { renderHook, act, waitFor } from '@testing-library/react';
import { useDuplicatesFinder } from '../use-duplicates-finder';
import * as tauriModule from '../use-tauri';

jest.mock('../use-tauri', () => ({
  invoke: jest.fn(),
}));

describe('useDuplicatesFinder', () => {
  const mockDuplicates = [
    {
      hash: 'abc123',
      files: [
        {
          path: 'C:\\file1.txt',
          name: 'file1.txt',
          size: 1024,
          modified: '2025-06-13T10:00:00Z',
          created: '2025-06-01T10:00:00Z',
          is_directory: false,
          extension: 'txt',
        },
        {
          path: 'D:\\backup\\file1.txt',
          name: 'file1.txt',
          size: 1024,
          modified: '2025-06-13T10:00:00Z',
          created: '2025-06-01T10:00:00Z',
          is_directory: false,
          extension: 'txt',
        },
      ],
      total_size: 2048,
      potential_savings: 1024,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should find duplicates successfully', async () => {
    const mockInvoke = tauriModule.invoke as jest.Mock;
    mockInvoke.mockResolvedValueOnce(mockDuplicates);

    const { result } = renderHook(() => useDuplicatesFinder());

    await act(async () => {
      await result.current.findDuplicates();
    });

    expect(result.current.duplicates).toEqual(mockDuplicates);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should delete duplicates and refresh list', async () => {
    const mockInvoke = tauriModule.invoke as jest.Mock;
    mockInvoke
      .mockResolvedValueOnce(mockDuplicates) // Initial find
      .mockResolvedValueOnce(true) // Delete operation
      .mockResolvedValueOnce([]); // Refresh after delete

    const { result } = renderHook(() => useDuplicatesFinder());

    // Find duplicates first
    await act(async () => {
      await result.current.findDuplicates();
    });

    expect(result.current.duplicates).toHaveLength(1);

    // Delete duplicates
    await act(async () => {
      await result.current.deleteDuplicates(['D:\\backup\\file1.txt']);
    });

    expect(result.current.duplicates).toHaveLength(0);
    expect(tauriModule.invoke).toHaveBeenCalledWith('perform_file_operation', {
      operation: {
        operation: 'delete',
        source: 'D:\\backup\\file1.txt',
        destination: null,
      },
    });
  });

  it('should format bytes correctly', () => {
    const { result } = renderHook(() => useDuplicatesFinder());

    expect(result.current.formatBytes(0)).toBe('0 B');
    expect(result.current.formatBytes(1024)).toBe('1 KB');
    expect(result.current.formatBytes(1048576)).toBe('1 MB');
    expect(result.current.formatBytes(1073741824)).toBe('1 GB');
  });

  it('should handle errors during duplicate finding', async () => {
    const mockError = new Error('Scan failed');
    const mockInvoke = tauriModule.invoke as jest.Mock;
    mockInvoke.mockRejectedValueOnce(mockError);

    const { result } = renderHook(() => useDuplicatesFinder());

    await act(async () => {
      await result.current.findDuplicates();
    });

    expect(result.current.duplicates).toHaveLength(0);
    expect(result.current.error).toBe('Scan failed');
    expect(result.current.loading).toBe(false);
  });

  it('should handle deletion errors gracefully', async () => {
    const mockError = new Error('Permission denied');
    const mockInvoke = tauriModule.invoke as jest.Mock;
    mockInvoke
      .mockResolvedValueOnce(mockDuplicates)
      .mockRejectedValueOnce(mockError);

    const { result } = renderHook(() => useDuplicatesFinder());

    await act(async () => {
      await result.current.findDuplicates();
    });

    await act(async () => {
      await result.current.deleteDuplicates(['C:\\protected\\file.txt']);
    });

    expect(result.current.error).toBe('Permission denied');
    // Duplicates should still be present after failed deletion
    expect(result.current.duplicates).toHaveLength(1);
  });
});