import { renderHook, act, waitFor } from '@testing-library/react';
import { useSystemOverview } from '../useSystemOverview';
import * as tauriModule from '../use-tauri';

// Mock the Tauri invoke function
jest.mock('../use-tauri', () => ({
  invoke: jest.fn(),
}));

describe('useSystemOverview', () => {
  const mockSystemOverview = {
    disks: [
      {
        name: 'Local Disk (C:)',
        mount_point: 'C:\\',
        total_space: 500000000000,
        available_space: 100000000000,
        used_space: 400000000000,
        file_system: 'NTFS',
      },
    ],
    summary: {
      total_space: 500000000000,
      used_space: 400000000000,
      free_space: 100000000000,
      total_files: 100000,
      duplicate_files: 5000,
      large_files: 500,
      last_scan_date: '2025-06-13',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch system overview on mount', async () => {
    (tauriModule.invoke as jest.Mock).mockResolvedValueOnce(mockSystemOverview);

    const { result } = renderHook(() => useSystemOverview());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.overview).toEqual(mockSystemOverview);
    expect(result.current.error).toBeNull();
  });

  it('should handle errors gracefully', async () => {
    const mockError = new Error('Failed to fetch');
    (tauriModule.invoke as jest.Mock).mockRejectedValueOnce(mockError);

    const { result } = renderHook(() => useSystemOverview());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.overview).toBeNull();
    expect(result.current.error).toBe('Failed to fetch');
  });

  it('should refresh data when refresh is called', async () => {
    (tauriModule.invoke as jest.Mock)
      .mockResolvedValueOnce(mockSystemOverview)
      .mockResolvedValueOnce({
        ...mockSystemOverview,
        summary: {
          ...mockSystemOverview.summary,
          total_files: 110000,
        },
      });

    const { result } = renderHook(() => useSystemOverview());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.overview?.summary.total_files).toBe(110000);
    expect(tauriModule.invoke).toHaveBeenCalledTimes(2);
  });

  it('should auto-refresh when enabled', async () => {
    jest.useFakeTimers();
    (tauriModule.invoke as jest.Mock).mockResolvedValue(mockSystemOverview);

    const { result } = renderHook(() => useSystemOverview(true));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Fast-forward 30 seconds
    act(() => {
      jest.advanceTimersByTime(30000);
    });

    await waitFor(() => {
      expect(tauriModule.invoke).toHaveBeenCalledTimes(2);
    });

    jest.useRealTimers();
  });

  it('should format disk space correctly', async () => {
    (tauriModule.invoke as jest.Mock).mockResolvedValueOnce(mockSystemOverview);

    const { result } = renderHook(() => useSystemOverview());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const formattedSpace = result.current.formatBytes(1024 * 1024 * 1024);
    expect(formattedSpace).toBe('1.00 GB');
  });
});