import { useState, useCallback } from 'react';
import { invoke } from './use-tauri';
import type { DirectoryStructure } from './useOrganization';

export interface OrganizationPreview {
  before: DirectoryStructure;
  after: DirectoryStructure;
  changes: Change[];
}

export interface Change {
  change_type: string; // "create", "move", "rename", "delete"
  source?: string;
  destination?: string;
  description: string;
}

export const useOrganizationPreview = () => {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<OrganizationPreview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generatePreview = useCallback(async (planId: string) => {
    setLoading(true);
    setError(null);

    try {
      const previewData = await invoke<OrganizationPreview>('preview_organization_changes', {
        plan_id: planId,
      });

      setPreview(previewData);
      return previewData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate preview';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearPreview = useCallback(() => {
    setPreview(null);
    setError(null);
  }, []);

  const getChangesByType = useCallback((changeType: string) => {
    if (!preview) return [];
    return preview.changes.filter(change => change.change_type === changeType);
  }, [preview]);

  const getChangeSummary = useCallback(() => {
    if (!preview) return null;

    const summary = preview.changes.reduce((acc, change) => {
      acc[change.change_type] = (acc[change.change_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: preview.changes.length,
      creates: summary.create || 0,
      moves: summary.move || 0,
      renames: summary.rename || 0,
      deletes: summary.delete || 0,
    };
  }, [preview]);

  const hasChanges = useCallback(() => {
    return preview && preview.changes.length > 0;
  }, [preview]);

  const getImpactLevel = useCallback(() => {
    if (!preview) return 'none';
    
    const changeCount = preview.changes.length;
    const hasDeletes = preview.changes.some(c => c.change_type === 'delete');
    
    if (hasDeletes || changeCount > 100) return 'high';
    if (changeCount > 20) return 'medium';
    if (changeCount > 0) return 'low';
    return 'none';
  }, [preview]);

  const getImpactColor = useCallback(() => {
    const level = getImpactLevel();
    switch (level) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  }, [getImpactLevel]);

  return {
    loading,
    preview,
    error,
    generatePreview,
    clearPreview,
    getChangesByType,
    getChangeSummary,
    hasChanges,
    getImpactLevel,
    getImpactColor,
  };
};