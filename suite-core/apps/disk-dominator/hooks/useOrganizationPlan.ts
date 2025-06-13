import { useState, useCallback } from 'react';
import { invoke } from './use-tauri';
import type { OrganizationRule } from './useOrganization';

export interface OrganizationPlan {
  id: string;
  name: string;
  description: string;
  created_at: string;
  status: string; // "draft", "ready", "executing", "completed", "failed"
  operations: PlanOperation[];
  metadata: PlanMetadata;
  ai_generated: boolean;
  ai_prompt?: string;
}

export interface PlanMetadata {
  total_files: number;
  total_size: number;
  estimated_duration: number; // seconds
  affected_paths: string[];
}

export interface PlanOperation {
  id: string;
  plan_id: string;
  sequence: number;
  operation_type: string; // "move", "copy", "rename", "delete", "mkdir", "archive"
  status: string; // "pending", "in_progress", "completed", "failed", "skipped"
  source: OperationSource;
  destination: OperationDestination;
  options: OperationOptions;
  result?: OperationResult;
}

export interface OperationSource {
  paths: string[];
  pattern?: string;
}

export interface OperationDestination {
  path: string;
  create_if_not_exists: boolean;
  rename_pattern?: string;
}

export interface OperationOptions {
  overwrite_existing?: boolean;
  preserve_attributes?: boolean;
  follow_symlinks?: boolean;
}

export interface OperationResult {
  processed_files: number;
  failed_files: number;
  duration: number;
  errors: string[];
}

export interface OrganizationExecution {
  id: string;
  plan_id: string;
  started_at: string;
  completed_at?: string;
  status: string; // "running", "completed", "failed", "cancelled"
  progress: ExecutionProgress;
  rollback_available: boolean;
  rollback_data?: RollbackData;
  summary?: ExecutionSummary;
}

export interface ExecutionProgress {
  current_operation: number;
  total_operations: number;
  current_file?: string;
  percentage: number;
}

export interface RollbackData {
  operations: RollbackOperation[];
  expires_at: string;
}

export interface RollbackOperation {
  operation_type: string;
  original_path: string;
  moved_to_path?: string;
  backup_path?: string;
}

export interface ExecutionSummary {
  files_moved: number;
  files_renamed: number;
  files_deleted: number;
  space_saved: number;
  errors: string[];
}

export const useOrganizationPlan = () => {
  const [creating, setCreating] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<OrganizationPlan | null>(null);
  const [currentExecution, setCurrentExecution] = useState<OrganizationExecution | null>(null);
  const [error, setError] = useState<string | null>(null);

  const createPlan = useCallback(async (
    name: string,
    description: string,
    rules: OrganizationRule[],
    aiEnabled: boolean = false,
    aiPrompt?: string,
    paths: string[] = []
  ) => {
    setCreating(true);
    setError(null);

    try {
      const plan = await invoke<OrganizationPlan>('create_organization_plan', {
        name,
        description,
        rules,
        ai_enabled: aiEnabled,
        ai_prompt: aiPrompt,
        paths,
      });

      setCurrentPlan(plan);
      return plan;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create organization plan';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setCreating(false);
    }
  }, []);

  const executePlan = useCallback(async (
    planId: string,
    options: {
      dryRun?: boolean;
      createBackup?: boolean;
    } = {}
  ) => {
    setExecuting(true);
    setError(null);

    try {
      const execution = await invoke<OrganizationExecution>('execute_organization_plan', {
        plan_id: planId,
        dry_run: options.dryRun,
        create_backup: options.createBackup,
      });

      setCurrentExecution(execution);
      return execution;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to execute organization plan';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setExecuting(false);
    }
  }, []);

  const rollbackPlan = useCallback(async (planId: string) => {
    setExecuting(true);
    setError(null);

    try {
      const success = await invoke<boolean>('rollback_organization', {
        plan_id: planId,
      });

      if (success && currentPlan?.id === planId) {
        setCurrentPlan(prev => prev ? { ...prev, status: 'rolled_back' } : null);
      }

      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to rollback organization';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setExecuting(false);
    }
  }, [currentPlan]);

  const clearPlan = useCallback(() => {
    setCurrentPlan(null);
    setCurrentExecution(null);
    setError(null);
  }, []);

  const updatePlanStatus = useCallback((planId: string, status: string) => {
    if (currentPlan?.id === planId) {
      setCurrentPlan(prev => prev ? { ...prev, status } : null);
    }
  }, [currentPlan]);

  const formatDuration = useCallback((seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  }, []);

  const formatFileSize = useCallback((bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }, []);

  return {
    creating,
    executing,
    currentPlan,
    currentExecution,
    error,
    createPlan,
    executePlan,
    rollbackPlan,
    clearPlan,
    updatePlanStatus,
    formatDuration,
    formatFileSize,
  };
};