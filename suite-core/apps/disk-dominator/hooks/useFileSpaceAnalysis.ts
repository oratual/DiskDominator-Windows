import { useState, useCallback, useEffect } from 'react';
import { invoke } from './use-tauri';
import { SpaceAnalysis } from './use-large-files';

export const useFileSpaceAnalysis = (autoAnalyze: boolean = false) => {
  const [analysis, setAnalysis] = useState<SpaceAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeSpace = useCallback(async (paths?: string[]) => {
    try {
      setLoading(true);
      setError(null);
      const result = await invoke<SpaceAnalysis>('get_file_space_analysis', {
        paths
      });
      setAnalysis(result);
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to analyze space';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-analyze on mount if requested
  useEffect(() => {
    if (autoAnalyze) {
      analyzeSpace();
    }
  }, [autoAnalyze, analyzeSpace]);

  const getTypeColor = (fileType: string): string => {
    const colors: Record<string, string> = {
      image: 'bg-blue-500',
      video: 'bg-purple-500',
      audio: 'bg-pink-500',
      document: 'bg-yellow-500',
      archive: 'bg-green-500',
      code: 'bg-cyan-500',
      other: 'bg-gray-500'
    };
    return colors[fileType] || colors.other;
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  const getLargestTypes = (limit: number = 5): Array<[string, SpaceAnalysis['by_type'][string]]> => {
    if (!analysis) return [];
    
    return Object.entries(analysis.by_type)
      .sort((a, b) => b[1].size - a[1].size)
      .slice(0, limit);
  };

  const getTotalWastedSpace = (): number => {
    if (!analysis) return 0;
    
    // Calculate potential wasted space (files that could be compressed)
    let wastedSpace = 0;
    for (const [type, data] of Object.entries(analysis.by_type)) {
      // Estimate compression potential based on file type
      const compressionRatio = getCompressionRatio(type);
      wastedSpace += data.size * compressionRatio;
    }
    return wastedSpace;
  };

  const getCompressionRatio = (fileType: string): number => {
    const ratios: Record<string, number> = {
      text: 0.7,
      code: 0.7,
      log: 0.8,
      document: 0.5,
      image: 0.2, // Most images are already compressed
      video: 0.1, // Videos are heavily compressed
      audio: 0.1,
      archive: 0.05, // Already compressed
      other: 0.3
    };
    return ratios[fileType] || 0.3;
  };

  return {
    analysis,
    loading,
    error,
    analyzeSpace,
    getTypeColor,
    formatPercentage,
    getLargestTypes,
    getTotalWastedSpace,
    getCompressionRatio
  };
};