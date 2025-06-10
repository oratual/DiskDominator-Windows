import { useState, useCallback } from 'react';
import { invoke } from './use-tauri';

export interface AIAnalysisRequest {
  path: string;
  analysis_type: 'categorize' | 'suggest_cleanup' | 'identify_important';
}

export interface FileCategory {
  name: string;
  files: string[];
  reason: string;
}

export interface AIAnalysisResponse {
  suggestions: string[];
  categories: FileCategory[];
  confidence: number;
}

export const useAIAssistant = () => {
  const [analyzing, setAnalyzing] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<AIAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async (request: AIAnalysisRequest): Promise<AIAnalysisResponse | null> => {
    setAnalyzing(true);
    setError(null);

    try {
      const response = await invoke<AIAnalysisResponse>('ai_analyze', { request });
      setLastAnalysis(response);
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
      return null;
    } finally {
      setAnalyzing(false);
    }
  }, []);

  const categorizeFiles = useCallback(async (path: string) => {
    return analyze({ path, analysis_type: 'categorize' });
  }, [analyze]);

  const suggestCleanup = useCallback(async (path: string) => {
    return analyze({ path, analysis_type: 'suggest_cleanup' });
  }, [analyze]);

  const identifyImportantFiles = useCallback(async (path: string) => {
    return analyze({ path, analysis_type: 'identify_important' });
  }, [analyze]);

  return {
    analyzing,
    lastAnalysis,
    error,
    analyze,
    categorizeFiles,
    suggestCleanup,
    identifyImportantFiles,
  };
};