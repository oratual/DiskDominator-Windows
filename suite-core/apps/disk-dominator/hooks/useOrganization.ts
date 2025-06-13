import { useState, useCallback, useEffect } from 'react';
import { invoke } from './use-tauri';

export interface OrganizationRule {
  id: string;
  name: string;
  enabled: boolean;
  priority: number;
  condition: RuleCondition;
  action: RuleAction;
  scope: RuleScope;
}

export interface RuleCondition {
  condition_type: string; // "extension", "name_pattern", "date_range", "size_range", "mime_type", "folder_depth"
  operator: string; // "equals", "contains", "matches", "greater_than", "less_than", "between"
  value: any;
  case_sensitive?: boolean;
}

export interface RuleAction {
  action_type: string; // "move", "copy", "rename", "tag", "archive"
  destination?: string;
  pattern?: string;
  archive_format?: string; // "zip", "7z", "tar.gz"
}

export interface RuleScope {
  paths: string[];
  recursive: boolean;
  include_hidden: boolean;
}

export interface DirectoryStructure {
  path: string;
  name: string;
  is_directory: boolean;
  size: number;
  modified: string;
  file_count: number;
  subdirectory_count: number;
  children: DirectoryStructure[];
}

export interface OrganizationSuggestion {
  id: string;
  suggestion_type: string; // "move", "rename", "group", "delete", "archive"
  title: string;
  description: string;
  from_paths: string[];
  to_path: string;
  affected_files: FileInfo[];
  estimated_time: number;
  confidence: number;
  reason: string;
}

export interface FileInfo {
  path: string;
  name: string;
  size: number;
  modified: string;
  file_type: string;
}

export interface OrganizationAnalysis {
  suggestions: OrganizationSuggestion[];
  insights: OrganizationInsights;
}

export interface OrganizationInsights {
  disorganized_folders: string[];
  naming_inconsistencies: string[];
  duplicate_structures: string[];
  unused_directories: string[];
}

export const useOrganization = () => {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<OrganizationAnalysis | null>(null);
  const [directoryStructure, setDirectoryStructure] = useState<DirectoryStructure | null>(null);
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const analyzeDirectory = useCallback(async (path: string) => {
    setAnalyzing(true);
    setError(null);
    
    try {
      const structure = await invoke<DirectoryStructure>('analyze_directory_structure', { path });
      setDirectoryStructure(structure);
      return structure;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze directory';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setAnalyzing(false);
    }
  }, []);

  const getSuggestions = useCallback(async (paths: string[]) => {
    setAnalyzing(true);
    setError(null);
    
    try {
      const analysisResult = await invoke<OrganizationAnalysis>('get_organization_suggestions', { paths });
      setAnalysis(analysisResult);
      return analysisResult;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get organization suggestions';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setAnalyzing(false);
    }
  }, []);

  const toggleSuggestion = useCallback((suggestionId: string) => {
    setSelectedSuggestions(prev => {
      if (prev.includes(suggestionId)) {
        return prev.filter(id => id !== suggestionId);
      } else {
        return [...prev, suggestionId];
      }
    });
  }, []);

  const selectAllSuggestions = useCallback(() => {
    if (analysis) {
      setSelectedSuggestions(analysis.suggestions.map(s => s.id));
    }
  }, [analysis]);

  const clearSuggestions = useCallback(() => {
    setSelectedSuggestions([]);
  }, []);

  const getSelectedSuggestions = useCallback(() => {
    if (!analysis) return [];
    return analysis.suggestions.filter(s => selectedSuggestions.includes(s.id));
  }, [analysis, selectedSuggestions]);

  return {
    analyzing,
    analysis,
    directoryStructure,
    selectedSuggestions,
    error,
    analyzeDirectory,
    getSuggestions,
    toggleSuggestion,
    selectAllSuggestions,
    clearSuggestions,
    getSelectedSuggestions,
  };
};