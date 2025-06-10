use serde::{Deserialize, Serialize};
use tauri::State;
use anyhow::Result;
use crate::app_state::AppState;
use crate::file_system::{FileInfo, DiskInfo, ScanProgress};
use crate::disk_analyzer::{DiskAnalyzer, ScanType, DuplicateGroup};

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
    
    // Retrieve cached scan results
    let files = storage.get_cached_files()
        .await
        .map_err(|e| e.to_string())?;
    
    // Filter files by size
    let min_size_bytes = min_size_mb * 1024 * 1024;
    let large_files: Vec<FileInfo> = files
        .into_iter()
        .filter(|f| f.size >= min_size_bytes)
        .collect();
    
    Ok(large_files)
}

/// Find duplicate files
#[tauri::command]
pub async fn find_duplicates(
    state: State<'_, AppState>,
) -> Result<Vec<DuplicateGroup>, String> {
    let analyzer = DiskAnalyzer::new();
    let storage = state.storage.read().await;
    
    let files = storage.get_cached_files()
        .await
        .map_err(|e| e.to_string())?;
    
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
    
    // Use AI to suggest organization
    let suggestions = ai.suggest_organization(&source_path, &rules)
        .await
        .map_err(|e| e.to_string())?;
    
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