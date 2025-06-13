import { useState, useCallback } from 'react';
import { invoke } from './use-tauri';
import { useRouter } from 'next/navigation';

export type QuickActionType = 'scan_disk' | 'find_duplicates' | 'large_files' | 'organize_disk';

export interface QuickAction {
  id: QuickActionType;
  title: string;
  description: string;
  icon: string;
  color: string;
  route: string;
  enabled: boolean;
  requiresScan?: boolean;
}

export interface QuickActionResult {
  success: boolean;
  message: string;
  action_type: QuickActionType;
}

export const useQuickActions = () => {
  const router = useRouter();
  const [executing, setExecuting] = useState<QuickActionType | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Define all quick actions
  const quickActions: QuickAction[] = [
    {
      id: 'scan_disk',
      title: 'Analizar Discos',
      description: 'Realiza dos escaneos completos de tus unidades. El primero, más rápido, dura unos minutos y te permite usar las pestañas de Duplicados y de Archivos Gigantes.',
      icon: 'RefreshCw',
      color: '#FF4081',
      route: '/disk-status',
      enabled: true,
    },
    {
      id: 'find_duplicates',
      title: 'Encontrar Duplicados',
      description: 'Identifica archivos duplicados en tu sistema para liberar espacio. Analiza contenido, no solo nombres.',
      icon: 'Copy',
      color: '#00b8d4',
      route: '/duplicates',
      enabled: true,
      requiresScan: true,
    },
    {
      id: 'large_files',
      title: 'Archivos Gigantes',
      description: 'Localiza los archivos más grandes de tu sistema. Encuentra rápidamente qué está ocupando más espacio.',
      icon: 'HardDrive',
      color: '#4CAF50',
      route: '/big-files',
      enabled: true,
      requiresScan: true,
    },
    {
      id: 'organize_disk',
      title: 'Organizar Disco',
      description: 'Reorganiza automáticamente tus archivos por tipo, fecha o tamaño. Mantén tu disco ordenado.',
      icon: 'FolderOpen',
      color: '#9C27B0',
      route: '/organize',
      enabled: true,
      requiresScan: true,
    },
  ];

  const executeAction = useCallback(async (actionType: QuickActionType) => {
    setExecuting(actionType);
    setError(null);

    try {
      // Call Tauri command
      const result = await invoke<QuickActionResult>('execute_quick_action', { 
        action_type: actionType 
      });

      if (result.success) {
        // Navigate to the appropriate route
        const action = quickActions.find(a => a.id === actionType);
        if (action) {
          router.push(action.route);
        }
      } else {
        setError(result.message);
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to execute quick action';
      setError(errorMessage);
      
      // In development, simulate navigation
      if (process.env.NODE_ENV === 'development') {
        const action = quickActions.find(a => a.id === actionType);
        if (action) {
          router.push(action.route);
        }
      }
      
      throw err;
    } finally {
      setExecuting(null);
    }
  }, [router]);

  return {
    quickActions,
    executeAction,
    executing,
    error,
  };
};