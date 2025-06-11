use serde::{Deserialize, Serialize};
use tauri::State;
use anyhow::Result;
use crate::app_state::AppState;
use crate::file_system::{FileInfo, DiskInfo, ScanProgress};
use crate::disk_analyzer::{DiskAnalyzer, ScanType, DuplicateGroup};
use ai_module::OrganizeRules as AiOrganizeRules;
use ai_module::FileOperation as AiFileOperation;

#[derive(Debug, Serialize, Deserialize)]
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

/// Scan a disk or directory
#[tauri::command]
pub async fn scan_disk(
    path: String,
    options: ScanOptions,
    state: State<'_, AppState>,
) -> Result<Vec<FileInfo>, String> {
    let analyzer = DiskAnalyzer::new();
    
    // Store scan progress in app state for real-time updates
    let storage = state.storage.write().await;
    
    analyzer.scan_directory(&path, &options)
        .await
        .map_err(|e| e.to_string())
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
    
    // For now, return empty vec as we haven't implemented proper caching yet
    // In a real implementation, we would convert FileInfo to FileInfo
    let large_files = Vec::new();
    
    Ok(large_files)
}

/// Find duplicate files
#[tauri::command]
pub async fn find_duplicates(
    state: State<'_, AppState>,
) -> Result<Vec<DuplicateGroup>, String> {
    let analyzer = DiskAnalyzer::new();
    
    // For now, return empty vec as we haven't implemented proper caching yet
    let files = Vec::new();
    
    analyzer.find_duplicates(files)
        .await
        .map_err(|e| e.to_string())
}

/// Organize files based on rules
#[tauri::command]
pub async fn organize_files(
    source_path: String,
    target_path: String,
    rules: OrganizeRules,
    state: State<'_, AppState>,
) -> Result<Vec<FileOperation>, String> {
    let ai = state.ai.read().await;
    
    // Convert our rules to AI module rules
    let ai_rules = AiOrganizeRules {
        by_extension: rules.by_extension,
        by_date: rules.by_date,
        by_size: rules.by_size,
        custom_rules: rules.custom_rules,
    };
    
    // Use AI to suggest organization
    let ai_suggestions = ai.suggest_organization(&source_path, &ai_rules)
        .await
        .map_err(|e| e.to_string())?;
    
    // Convert AI file operations to our file operations
    let suggestions = ai_suggestions.into_iter().map(|op| FileOperation {
        operation: op.operation,
        source: op.source,
        destination: op.destination,
    }).collect();
    
    Ok(suggestions)
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
    state: State<'_, AppState>,
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