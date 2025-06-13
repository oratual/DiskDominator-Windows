import { useState, useCallback, useMemo } from 'react';
import { invoke } from './use-tauri';
import { DuplicateGroup, DuplicateCopy } from './use-duplicates-finder';

export type SelectionStrategy = 'keep-newest' | 'keep-oldest' | 'keep-in-organized' | 'ai-suggestion';

export interface SelectionResult {
  group_id: string;
  keep_ids: string[];
  delete_ids: string[];
  reason: string;
}

export interface SelectionState {
  [groupId: string]: {
    keepIds: Set<string>;
    deleteIds: Set<string>;
  };
}

export const useDuplicateSelection = (duplicateGroups: DuplicateGroup[]) => {
  const [selections, setSelections] = useState<SelectionState>({});
  const [isApplyingStrategy, setIsApplyingStrategy] = useState(false);

  // Initialize selections when duplicate groups change
  useCallback(() => {
    const newSelections: SelectionState = {};
    duplicateGroups.forEach(group => {
      if (!selections[group.id]) {
        const keepIds = new Set<string>();
        const deleteIds = new Set<string>();
        
        // Apply default selection (keep original)
        group.copies.forEach(copy => {
          if (copy.keep_suggestion || copy.is_original) {
            keepIds.add(copy.id);
          } else {
            deleteIds.add(copy.id);
          }
        });
        
        newSelections[group.id] = { keepIds, deleteIds };
      } else {
        newSelections[group.id] = selections[group.id];
      }
    });
    setSelections(newSelections);
  }, [duplicateGroups]);

  const toggleFileSelection = useCallback((groupId: string, fileId: string, action: 'keep' | 'delete') => {
    setSelections(prev => {
      const newSelections = { ...prev };
      const group = newSelections[groupId] || { keepIds: new Set(), deleteIds: new Set() };
      
      if (action === 'keep') {
        group.deleteIds.delete(fileId);
        if (group.keepIds.has(fileId)) {
          group.keepIds.delete(fileId);
        } else {
          group.keepIds.add(fileId);
        }
      } else {
        group.keepIds.delete(fileId);
        if (group.deleteIds.has(fileId)) {
          group.deleteIds.delete(fileId);
        } else {
          group.deleteIds.add(fileId);
        }
      }
      
      newSelections[groupId] = group;
      return newSelections;
    });
  }, []);

  const selectAll = useCallback((groupId: string, action: 'keep' | 'delete') => {
    const group = duplicateGroups.find(g => g.id === groupId);
    if (!group) return;

    setSelections(prev => {
      const newSelections = { ...prev };
      const selection = { keepIds: new Set<string>(), deleteIds: new Set<string>() };
      
      group.copies.forEach(copy => {
        if (action === 'keep') {
          selection.keepIds.add(copy.id);
        } else {
          selection.deleteIds.add(copy.id);
        }
      });
      
      newSelections[groupId] = selection;
      return newSelections;
    });
  }, [duplicateGroups]);

  const applySmartSelection = useCallback(async (strategy: SelectionStrategy, groupIds?: string[]) => {
    try {
      setIsApplyingStrategy(true);
      
      const targetGroupIds = groupIds || duplicateGroups.map(g => g.id);
      
      const results = await invoke<SelectionResult[]>('smart_select_duplicates', {
        strategy: {
          strategy,
          group_ids: targetGroupIds,
        },
      });
      
      // Apply the results to selections
      const newSelections = { ...selections };
      results.forEach(result => {
        newSelections[result.group_id] = {
          keepIds: new Set(result.keep_ids),
          deleteIds: new Set(result.delete_ids),
        };
      });
      
      setSelections(newSelections);
      return results;
    } catch (error) {
      console.error('Failed to apply smart selection:', error);
      throw error;
    } finally {
      setIsApplyingStrategy(false);
    }
  }, [duplicateGroups, selections]);

  const getSelectedFilesForDeletion = useCallback((): string[] => {
    const filesToDelete: string[] = [];
    
    Object.entries(selections).forEach(([groupId, selection]) => {
      filesToDelete.push(...Array.from(selection.deleteIds));
    });
    
    return filesToDelete;
  }, [selections]);

  const getSelectionStats = useMemo(() => {
    let totalToDelete = 0;
    let totalToKeep = 0;
    let spaceToRecover = 0;
    
    duplicateGroups.forEach(group => {
      const selection = selections[group.id];
      if (selection) {
        totalToKeep += selection.keepIds.size;
        totalToDelete += selection.deleteIds.size;
        
        // Calculate space to recover
        group.copies.forEach(copy => {
          if (selection.deleteIds.has(copy.id)) {
            spaceToRecover += copy.size;
          }
        });
      }
    });
    
    return {
      totalToDelete,
      totalToKeep,
      spaceToRecover,
      groupsWithSelection: Object.keys(selections).length,
    };
  }, [selections, duplicateGroups]);

  const clearSelections = useCallback(() => {
    setSelections({});
  }, []);

  const isFileSelected = useCallback((groupId: string, fileId: string, type: 'keep' | 'delete'): boolean => {
    const selection = selections[groupId];
    if (!selection) return false;
    
    return type === 'keep' 
      ? selection.keepIds.has(fileId)
      : selection.deleteIds.has(fileId);
  }, [selections]);

  return {
    selections,
    toggleFileSelection,
    selectAll,
    applySmartSelection,
    getSelectedFilesForDeletion,
    getSelectionStats,
    clearSelections,
    isFileSelected,
    isApplyingStrategy,
  };
};