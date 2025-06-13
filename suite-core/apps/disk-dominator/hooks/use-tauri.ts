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
  if (typeof window !== 'undefined' && '__TAURI__' in window && window.__TAURI__) {
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
      
    case 'get_system_overview':
      return {
        disks: [
          { id: 'C', label: 'Local Disk (C:)', path: 'C:\\', used: 325000000000, total: 500000000000, free: 175000000000, percentage: 65 },
          { id: 'D', label: 'Data (D:)', path: 'D:\\', used: 750000000000, total: 1000000000000, free: 250000000000, percentage: 75 },
        ],
        total_disk_space: 1500000000000,
        total_used_space: 1075000000000,
        total_free_space: 425000000000,
        duplicates_found: 120,
        space_recoverable: 4500000000,
        large_files_count: 45,
        last_full_scan: new Date().toISOString(),
      } as any;
      
    case 'get_recent_activity':
      return [
        {
          id: '1',
          action: 'Escaneo completado',
          target: 'Disco C:',
          time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          activity_type: 'scan_completed',
          status: 'success',
        }
      ] as any;
      
    case 'execute_quick_action':
      return {
        success: true,
        message: 'Action executed successfully',
        action_type: args?.action_type || 'scan_disk',
      } as any;

    case 'analyze_directory_structure':
      return {
        path: args?.path || 'C:/',
        name: 'Sample Directory',
        is_directory: true,
        size: 1024000000,
        modified: '1640995200',
        file_count: 150,
        subdirectory_count: 12,
        children: [],
      } as any;

    case 'get_organization_suggestions':
      return {
        suggestions: [
          {
            id: '1',
            suggestion_type: 'move',
            title: 'Move PDF files to Documents',
            description: 'Organize PDF files from Downloads to Documents folder',
            from_paths: ['C:/Users/Usuario/Downloads'],
            to_path: 'C:/Users/Usuario/Documents/PDFs',
            affected_files: [],
            estimated_time: 30,
            confidence: 0.85,
            reason: 'Many PDF files found in Downloads folder',
          },
          {
            id: '2',
            suggestion_type: 'group',
            title: 'Group image files by date',
            description: 'Organize photos in Pictures folder by creation date',
            from_paths: ['C:/Users/Usuario/Pictures'],
            to_path: 'C:/Users/Usuario/Pictures/Organized',
            affected_files: [],
            estimated_time: 60,
            confidence: 0.92,
            reason: 'Many unorganized image files detected',
          },
        ],
        insights: {
          disorganized_folders: ['C:/Users/Usuario/Downloads', 'C:/Users/Usuario/Desktop'],
          naming_inconsistencies: ['mixed_case_files', 'special_characters'],
          duplicate_structures: [],
          unused_directories: ['C:/Users/Usuario/Old Stuff'],
        },
      } as any;

    case 'create_organization_plan':
      return {
        id: 'plan_' + Date.now(),
        name: args?.name || 'Organization Plan',
        description: args?.description || 'Auto-generated organization plan',
        created_at: new Date().toISOString(),
        status: 'ready',
        operations: [
          {
            id: 'op_1',
            plan_id: 'plan_' + Date.now(),
            sequence: 0,
            operation_type: 'move',
            status: 'pending',
            source: { paths: ['C:/Users/Usuario/Downloads/file.pdf'] },
            destination: { path: 'C:/Users/Usuario/Documents/PDFs', create_if_not_exists: true },
            options: { overwrite_existing: false, preserve_attributes: true },
          },
        ],
        metadata: {
          total_files: 25,
          total_size: 104857600,
          estimated_duration: 45,
          affected_paths: ['C:/Users/Usuario/Downloads'],
        },
        ai_generated: args?.ai_enabled || false,
        ai_prompt: args?.ai_prompt,
      } as any;

    case 'execute_organization_plan':
      return {
        id: 'exec_' + Date.now(),
        plan_id: args?.plan_id || 'plan_123',
        started_at: new Date().toISOString(),
        completed_at: args?.dry_run ? new Date().toISOString() : undefined,
        status: args?.dry_run ? 'completed' : 'running',
        progress: {
          current_operation: 0,
          total_operations: 1,
          current_file: undefined,
          percentage: args?.dry_run ? 100 : 0,
        },
        rollback_available: !args?.dry_run,
        summary: args?.dry_run ? {
          files_moved: 0,
          files_renamed: 0,
          files_deleted: 0,
          space_saved: 0,
          errors: [],
        } : undefined,
      } as any;

    case 'preview_organization_changes':
      return {
        before: {
          path: '/example/source',
          name: 'source',
          is_directory: true,
          size: 1024000,
          modified: '1640995200',
          file_count: 10,
          subdirectory_count: 2,
          children: [],
        },
        after: {
          path: '/example/organized',
          name: 'organized',
          is_directory: true,
          size: 1024000,
          modified: Date.now().toString(),
          file_count: 10,
          subdirectory_count: 3,
          children: [],
        },
        changes: [
          {
            change_type: 'create',
            destination: '/example/organized',
            description: 'Create organized directory',
          },
          {
            change_type: 'move',
            source: '/example/source/file1.txt',
            destination: '/example/organized/documents/file1.txt',
            description: 'Move file1.txt to documents folder',
          },
        ],
      } as any;

    case 'rollback_organization':
      return true as any;

    // User commands
    case 'get_user_profile':
      return {
        id: 'default-user',
        name: 'Usuario Demo',
        email: 'demo@diskdominator.com',
        avatar_url: '/soccer-player-portrait.png',
        credits: 150,
        plan: 'Free',
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString(),
        stats: {
          total_scans: 12,
          space_saved: 2500000000,
          files_organized: 450,
          duplicates_removed: 89,
          large_files_found: 23,
        },
      } as any;

    case 'get_user_preferences':
      return {
        theme: 'system',
        language: 'es',
        readability: {
          text_size: 'normal',
          contrast: 'normal',
          spacing: 'normal',
          color_filter: 'none',
          reduce_motion: false,
          high_contrast_mode: false,
        },
        notifications: {
          email: true,
          push: true,
          scan_complete: true,
          weekly_report: false,
          tips_and_tricks: true,
        },
        privacy: {
          share_analytics: false,
          show_profile_public: false,
        },
        updated_at: new Date().toISOString(),
      } as any;

    case 'update_user_preferences':
      return args?.preferences || {
        theme: 'system',
        language: 'es',
        readability: {
          text_size: 'normal',
          contrast: 'normal',
          spacing: 'normal',
          color_filter: 'none',
          reduce_motion: false,
          high_contrast_mode: false,
        },
        notifications: {
          email: true,
          push: true,
          scan_complete: true,
          weekly_report: false,
          tips_and_tricks: true,
        },
        privacy: {
          share_analytics: false,
          show_profile_public: false,
        },
        updated_at: new Date().toISOString(),
      } as any;

    case 'get_user_credits':
      return {
        balance: 150,
        history: [
          {
            id: 'welcome-bonus',
            transaction_type: 'earned',
            amount: 100,
            description: 'Bonus de bienvenida',
            date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: 'scan-reward',
            transaction_type: 'earned',
            amount: 50,
            description: 'Recompensa por escaneo completo',
            date: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          },
        ],
        pending: 0,
      } as any;

    case 'add_user_credits':
      return {
        balance: 150 + (args?.amount || 0),
        history: [
          {
            id: `txn_${Date.now()}`,
            transaction_type: args?.transaction_type || 'earned',
            amount: args?.amount || 0,
            description: args?.description || 'Créditos añadidos',
            date: new Date().toISOString(),
          },
        ],
        pending: 0,
      } as any;

    case 'spend_user_credits':
      return {
        balance: Math.max(0, 150 - (args?.amount || 0)),
        history: [
          {
            id: `txn_${Date.now()}`,
            transaction_type: 'spent',
            amount: -(args?.amount || 0),
            description: args?.description || 'Créditos gastados',
            date: new Date().toISOString(),
          },
        ],
        pending: 0,
      } as any;

    case 'update_accessibility_settings':
      return {
        readability: args?.readability || {
          text_size: 'normal',
          contrast: 'normal',
          spacing: 'normal',
          color_filter: 'none',
          reduce_motion: false,
          high_contrast_mode: false,
        },
      } as any;

    case 'update_user_stats':
      return {
        id: 'default-user',
        name: 'Usuario Demo',
        email: 'demo@diskdominator.com',
        avatar_url: '/soccer-player-portrait.png',
        credits: 150,
        plan: 'Free',
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString(),
        stats: args?.stats || {
          total_scans: 0,
          space_saved: 0,
          files_organized: 0,
          duplicates_removed: 0,
          large_files_found: 0,
        },
      } as any;

    case 'reset_user_preferences':
      return {
        theme: 'system',
        language: 'es',
        readability: {
          text_size: 'normal',
          contrast: 'normal',
          spacing: 'normal',
          color_filter: 'none',
          reduce_motion: false,
          high_contrast_mode: false,
        },
        notifications: {
          email: true,
          push: true,
          scan_complete: true,
          weekly_report: false,
          tips_and_tricks: true,
        },
        privacy: {
          share_analytics: false,
          show_profile_public: false,
        },
        updated_at: new Date().toISOString(),
      } as any;

    case 'export_user_data':
      return {
        profile: {
          id: 'default-user',
          name: 'Usuario Demo',
          email: 'demo@diskdominator.com',
          plan: 'Free',
        },
        preferences: {
          theme: 'system',
          language: 'es',
        },
        credits: {
          balance: 150,
          history: [],
        },
        export_date: new Date().toISOString(),
      } as any;
      
    default:
      console.warn(`No mock implementation for command: ${cmd}`);
      return {} as any;
  }
}