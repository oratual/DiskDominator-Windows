use serde::{Deserialize, Serialize};
use tauri::State;
use anyhow::Result;
use crate::app_state::AppState;
use crate::file_system::{FileInfo, DiskInfo};
use crate::disk_analyzer::{DiskAnalyzer, ScanType, DuplicateGroup, ScanConfig, ScanSession};
// use ai_module::OrganizeRules as AiOrganizeRules;
// use ai_module::FileOperation as AiFileOperation;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanOptions {
    pub scan_type: ScanType,
    pub exclude_patterns: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OrganizeRules {
    pub by_extension: bool,
    pub by_date: bool,
    pub by_size: bool,
    pub custom_rules: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FileOperation {
    pub operation: String, // "move", "delete", "rename"
    pub source: String,
    pub destination: Option<String>,
}

/// Get current scan progress
#[tauri::command]
pub async fn get_scan_progress(
    state: State<'_, AppState>,
) -> Result<crate::disk_analyzer::ScanProgress, String> {
    if let Some(analyzer) = &*state.current_analyzer.read().await {
        Ok(analyzer.get_progress().await)
    } else {
        Ok(crate::disk_analyzer::ScanProgress {
            total_files: 0,
            processed_files: 0,
            total_size: 0,
            current_path: String::new(),
            errors: Vec::new(),
        })
    }
}

/// Create a new scan session
#[tauri::command]
pub async fn create_scan_session(
    disk_path: String,
    scan_type: String,
    exclude_patterns: Vec<String>,
    state: State<'_, AppState>,
) -> Result<String, String> {
    let analyzer = DiskAnalyzer::new(state.websocket_manager.clone());
    
    let scan_type_enum = match scan_type.as_str() {
        "quick" => ScanType::Quick,
        "deep" => ScanType::Deep,
        "custom" => ScanType::Custom,
        _ => return Err("Invalid scan type".to_string()),
    };

    let config = ScanConfig {
        exclude_patterns,
        include_hidden: false,
        follow_symlinks: false,
        max_depth: None,
        min_file_size: None,
        max_file_size: None,
        calculate_hashes: matches!(scan_type_enum, ScanType::Deep),
        quick_hash_threshold: 1024 * 1024, // 1MB
    };

    // Store analyzer for session management
    {
        let mut current = state.current_analyzer.write().await;
        *current = Some(analyzer);
    }

    let session_id = {
        let guard = state.current_analyzer.read().await;
        let analyzer = guard.as_ref().ok_or("Analyzer not initialized")?;
        analyzer.create_scan_session(disk_path, scan_type_enum, config)
            .await
            .map_err(|e| e.to_string())?
    };

    Ok(session_id)
}

/// Start a scan session
#[tauri::command]
pub async fn start_scan_session(
    session_id: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let guard = state.current_analyzer.read().await;
    let analyzer = guard.as_ref().ok_or("Analyzer not initialized")?;
    analyzer.start_scan_session(&session_id)
        .await
        .map_err(|e| e.to_string())
}

/// Pause a scan session
#[tauri::command]
pub async fn pause_scan_session(
    session_id: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let guard = state.current_analyzer.read().await;
    let analyzer = guard.as_ref().ok_or("Analyzer not initialized")?;
    analyzer.pause_scan_session(&session_id)
        .await
        .map_err(|e| e.to_string())
}

/// Resume a scan session
#[tauri::command]
pub async fn resume_scan_session(
    session_id: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let guard = state.current_analyzer.read().await;
    let analyzer = guard.as_ref().ok_or("Analyzer not initialized")?;
    analyzer.resume_scan_session(&session_id)
        .await
        .map_err(|e| e.to_string())
}

/// Cancel a scan session
#[tauri::command]
pub async fn cancel_scan_session(
    session_id: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let guard = state.current_analyzer.read().await;
    let analyzer = guard.as_ref().ok_or("Analyzer not initialized")?;
    analyzer.cancel_scan_session(&session_id)
        .await
        .map_err(|e| e.to_string())
}

/// Get scan session info
#[tauri::command]
pub async fn get_scan_session(
    session_id: String,
    state: State<'_, AppState>,
) -> Result<Option<ScanSession>, String> {
    let guard = state.current_analyzer.read().await;
    let analyzer = guard.as_ref().ok_or("Analyzer not initialized")?;
    Ok(analyzer.get_scan_session(&session_id).await)
}

/// Get all active scan sessions
#[tauri::command]
pub async fn get_active_scan_sessions(
    state: State<'_, AppState>,
) -> Result<std::collections::HashMap<String, ScanSession>, String> {
    let guard = state.current_analyzer.read().await;
    let analyzer = guard.as_ref().ok_or("Analyzer not initialized")?;
    Ok(analyzer.get_active_sessions().await)
}

/// Scan a disk or directory (backward compatibility)
#[tauri::command]
pub async fn scan_disk(
    path: String,
    options: ScanOptions,
    state: State<'_, AppState>,
) -> Result<Vec<FileInfo>, String> {
    let analyzer = DiskAnalyzer::new(state.websocket_manager.clone());
    
    // Store analyzer for progress tracking
    {
        let mut current = state.current_analyzer.write().await;
        *current = Some(analyzer);
    }
    
    // Perform the scan
    let files = {
        let guard = state.current_analyzer.read().await;
        let analyzer = guard.as_ref().ok_or("Analyzer not initialized")?;
        analyzer.scan_directory(&path, &options)
            .await
            .map_err(|e| e.to_string())?
    };
    
    // Store results in app state for later use
    {
        let mut storage = state.storage.write().await;
        storage.scan_results.insert(path.clone(), files.clone());
    }
    
    // Clear current analyzer
    {
        let mut current = state.current_analyzer.write().await;
        *current = None;
    }
    
    Ok(files)
}

/// Get disk information
#[tauri::command]
pub async fn get_disk_info() -> Result<Vec<DiskInfo>, String> {
    crate::file_system::get_system_disks()
        .await
        .map_err(|e| e.to_string())
}

/// Get large files above a certain size threshold
#[tauri::command]
pub async fn get_large_files(
    min_size_mb: u64,
    state: State<'_, AppState>,
) -> Result<Vec<FileInfo>, String> {
    let storage = state.storage.read().await;
    let min_size_bytes = min_size_mb * 1024 * 1024;
    
    // Filter files from scan results that are larger than threshold
    let mut large_files = Vec::new();
    for files in storage.scan_results.values() {
        for file in files {
            if file.size >= min_size_bytes {
                large_files.push(file.clone());
            }
        }
    }
    
    // Sort by size descending
    large_files.sort_by(|a, b| b.size.cmp(&a.size));
    
    Ok(large_files)
}

/// Find duplicate files
#[tauri::command]
pub async fn find_duplicates(
    state: State<'_, AppState>,
) -> Result<Vec<DuplicateGroup>, String> {
    let analyzer = DiskAnalyzer::new(state.websocket_manager.clone());
    
    // Get all files from stored scan results
    let storage = state.storage.read().await;
    let mut all_files = Vec::new();
    for files in storage.scan_results.values() {
        all_files.extend(files.clone());
    }
    
    if all_files.is_empty() {
        return Ok(Vec::new());
    }
    
    analyzer.find_duplicates(all_files)
        .await
        .map_err(|e| e.to_string())
}

/// Organize files based on rules
#[tauri::command]
pub async fn organize_files(
    _source_path: String,
    _target_path: String,
    _rules: OrganizeRules,
    _state: State<'_, AppState>,
) -> Result<Vec<FileOperation>, String> {
    // Temporarily return empty suggestions until AI module is available
    Ok(Vec::new())
    
    // Original implementation commented out:
    // let ai = state.ai.read().await;
    // 
    // // Convert our rules to AI module rules
    // let ai_rules = AiOrganizeRules {
    //     by_extension: rules.by_extension,
    //     by_date: rules.by_date,
    //     by_size: rules.by_size,
    //     custom_rules: rules.custom_rules,
    // };
    // 
    // // Use AI to suggest organization
    // let ai_suggestions = ai.suggest_organization(&source_path, &ai_rules)
    //     .await
    //     .map_err(|e| e.to_string())?;
    // 
    // // Convert AI file operations to our file operations
    // let suggestions = ai_suggestions.into_iter().map(|op| FileOperation {
    //     operation: op.operation,
    //     source: op.source,
    //     destination: op.destination,
    // }).collect();
    // 
    // Ok(suggestions)
}

/// Get detailed file metadata
#[tauri::command]
pub async fn get_file_metadata(path: String) -> Result<FileInfo, String> {
    crate::file_system::get_file_info(&path)
        .await
        .map_err(|e| e.to_string())
}

/// Perform file operation (move, delete, rename)
#[tauri::command]
pub async fn perform_file_operation(
    operation: FileOperation,
    _state: State<'_, AppState>,
) -> Result<bool, String> {
    match operation.operation.as_str() {
        "move" => {
            if let Some(dest) = operation.destination {
                crate::file_system::move_file(&operation.source, &dest)
                    .await
                    .map_err(|e| e.to_string())?;
            }
        }
        "delete" => {
            crate::file_system::delete_file(&operation.source)
                .await
                .map_err(|e| e.to_string())?;
        }
        "rename" => {
            if let Some(new_name) = operation.destination {
                crate::file_system::rename_file(&operation.source, &new_name)
                    .await
                    .map_err(|e| e.to_string())?;
            }
        }
        _ => return Err("Unknown operation".to_string()),
    }
    
    Ok(true)
}