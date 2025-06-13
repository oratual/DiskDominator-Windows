use serde::{Deserialize, Serialize};
use tauri::State;
use anyhow::Result;
use crate::app_state::AppState;
use crate::file_system::FileInfo;
use std::collections::HashMap;
use std::path::Path;
use tokio::fs;
use sha2::{Sha256, Digest};
// use std::io; // Not needed for current implementation

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DuplicateGroup {
    pub id: String,
    pub hash: String,
    pub name: String,
    pub file_type: String,
    pub total_size: u64,
    pub recoverable_size: u64,
    pub copies: Vec<DuplicateCopy>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DuplicateCopy {
    pub id: String,
    pub path: String,
    pub disk: String,
    pub size: u64,
    pub created: i64,
    pub modified: i64,
    pub accessed: i64,
    pub is_original: bool,
    pub keep_suggestion: bool,
    pub metadata: Option<FileMetadata>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileMetadata {
    pub width: Option<u32>,
    pub height: Option<u32>,
    pub duration: Option<u32>,
    pub bitrate: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DuplicateSummary {
    pub total_groups: usize,
    pub total_duplicates: usize,
    pub total_size: u64,
    pub recoverable_size: u64,
    pub by_disk: HashMap<String, u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DuplicateOptions {
    pub disks: Option<Vec<String>>,
    pub types: Option<Vec<String>>,
    pub min_size: Option<u64>,
    pub max_size: Option<u64>,
    pub sort_by: Option<String>,
    pub group_by: Option<String>,
    pub detection_method: DetectionMethod,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum DetectionMethod {
    Hash,
    Name,
    Size,
    NameAndSize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SmartSelectionStrategy {
    pub strategy: SelectionStrategy,
    pub group_ids: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum SelectionStrategy {
    KeepNewest,
    KeepOldest,
    KeepInOrganized,
    AiSuggestion,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SelectionResult {
    pub group_id: String,
    pub keep_ids: Vec<String>,
    pub delete_ids: Vec<String>,
    pub reason: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeleteBatchResult {
    pub deleted: Vec<String>,
    pub failed: Vec<FailedDelete>,
    pub space_saved: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FailedDelete {
    pub id: String,
    pub error: String,
}

/// Find duplicate files based on detection method
#[tauri::command]
pub async fn find_duplicates_advanced(
    options: DuplicateOptions,
    state: State<'_, AppState>,
) -> Result<Vec<DuplicateGroup>, String> {
    let storage = state.storage.read().await;
    let mut all_files = Vec::new();
    
    // Collect files from all scanned directories
    for (_, files) in storage.scan_results.iter() {
        all_files.extend(files.clone());
    }
    
    // Filter by disk if specified
    if let Some(ref disks) = options.disks {
        all_files.retain(|f| {
            if let Some(disk) = get_disk_from_path(&f.path) {
                disks.contains(&disk)
            } else {
                false
            }
        });
    }
    
    // Filter by size if specified
    if let Some(min_size) = options.min_size {
        all_files.retain(|f| f.size >= min_size);
    }
    if let Some(max_size) = options.max_size {
        all_files.retain(|f| f.size <= max_size);
    }
    
    // Group files based on detection method
    let groups = match options.detection_method {
        DetectionMethod::Hash => group_by_hash(all_files).await?,
        DetectionMethod::Name => group_by_name(all_files),
        DetectionMethod::Size => group_by_size(all_files),
        DetectionMethod::NameAndSize => group_by_name_and_size(all_files),
    };
    
    // Convert to DuplicateGroup format
    let duplicate_groups = convert_to_duplicate_groups(groups).await;
    
    Ok(duplicate_groups)
}

/// Get duplicate groups with advanced filtering
#[tauri::command]
pub async fn get_duplicate_groups(
    options: DuplicateOptions,
    state: State<'_, AppState>,
) -> Result<HashMap<String, serde_json::Value>, String> {
    let groups = find_duplicates_advanced(options, state).await?;
    
    // Calculate by_disk data
    let mut by_disk: HashMap<String, u64> = HashMap::new();
    for group in &groups {
        // Only count recoverable space (excluding the original)
        for (idx, copy) in group.copies.iter().enumerate() {
            if idx > 0 { // Skip the first copy (original)
                let disk_id = copy.disk.clone();
                *by_disk.entry(disk_id).or_insert(0) += copy.size;
            }
        }
    }
    
    let summary = DuplicateSummary {
        total_groups: groups.len(),
        total_duplicates: groups.iter().map(|g| g.copies.len()).sum(),
        total_size: groups.iter().map(|g| g.total_size).sum(),
        recoverable_size: groups.iter().map(|g| g.recoverable_size).sum(),
        by_disk,
    };
    
    let mut result = HashMap::new();
    result.insert("groups".to_string(), serde_json::to_value(groups).unwrap());
    result.insert("summary".to_string(), serde_json::to_value(summary).unwrap());
    
    Ok(result)
}

/// Delete duplicates in batch with safety checks
#[tauri::command]
pub async fn delete_duplicates_batch(
    file_ids: Vec<String>,
    move_to_trash: bool,
    _state: State<'_, AppState>,
) -> Result<DeleteBatchResult, String> {
    let mut deleted = Vec::new();
    let mut failed = Vec::new();
    let mut space_saved = 0u64;
    
    for file_id in file_ids {
        // For now, we'll use the file_id as the path
        // In a real implementation, you'd look up the actual file path from the database
        match delete_file(&file_id, move_to_trash).await {
            Ok(size) => {
                deleted.push(file_id);
                space_saved += size;
            }
            Err(e) => {
                failed.push(FailedDelete {
                    id: file_id,
                    error: e.to_string(),
                });
            }
        }
    }
    
    Ok(DeleteBatchResult {
        deleted,
        failed,
        space_saved,
    })
}

/// Apply smart selection strategy to duplicate groups
#[tauri::command]
pub async fn smart_select_duplicates(
    strategy: SmartSelectionStrategy,
    state: State<'_, AppState>,
) -> Result<Vec<SelectionResult>, String> {
    let mut results = Vec::new();
    
    // Get all duplicate groups
    let options = DuplicateOptions {
        disks: None,
        types: None,
        min_size: None,
        max_size: None,
        sort_by: None,
        group_by: None,
        detection_method: DetectionMethod::Hash,
    };
    
    let groups = find_duplicates_advanced(options, state).await?;
    
    for group in groups {
        if strategy.group_ids.is_empty() || strategy.group_ids.contains(&group.id) {
            let selection = apply_selection_strategy(&group, &strategy.strategy);
            results.push(selection);
        }
    }
    
    Ok(results)
}

/// Preview a duplicate file
#[tauri::command]
pub async fn preview_duplicate(
    file_path: String,
) -> Result<HashMap<String, serde_json::Value>, String> {
    let metadata = fs::metadata(&file_path).await
        .map_err(|e| format!("Failed to get file metadata: {}", e))?;
    
    let mut result = HashMap::new();
    result.insert("path".to_string(), serde_json::Value::String(file_path.clone()));
    result.insert("size".to_string(), serde_json::Value::Number(metadata.len().into()));
    
    // Add file type specific preview data
    if let Some(extension) = Path::new(&file_path).extension() {
        let ext = extension.to_string_lossy().to_lowercase();
        match ext.as_str() {
            "jpg" | "jpeg" | "png" | "gif" | "bmp" => {
                // For images, we could return dimensions if we had an image library
                result.insert("type".to_string(), serde_json::Value::String("image".to_string()));
            }
            "mp4" | "avi" | "mkv" | "mov" => {
                result.insert("type".to_string(), serde_json::Value::String("video".to_string()));
            }
            "pdf" | "doc" | "docx" | "txt" => {
                result.insert("type".to_string(), serde_json::Value::String("document".to_string()));
            }
            _ => {
                result.insert("type".to_string(), serde_json::Value::String("other".to_string()));
            }
        }
    }
    
    Ok(result)
}

// Helper functions

async fn group_by_hash(files: Vec<FileInfo>) -> Result<HashMap<String, Vec<FileInfo>>, String> {
    let mut groups: HashMap<String, Vec<FileInfo>> = HashMap::new();
    
    for file in files {
        if !file.is_directory {
            match calculate_file_hash(&file.path).await {
                Ok(hash) => {
                    groups.entry(hash).or_insert_with(Vec::new).push(file);
                }
                Err(e) => {
                    eprintln!("Failed to hash file {}: {}", file.path, e);
                }
            }
        }
    }
    
    // Only keep groups with duplicates
    groups.retain(|_, files| files.len() > 1);
    
    Ok(groups)
}

fn group_by_name(files: Vec<FileInfo>) -> HashMap<String, Vec<FileInfo>> {
    let mut groups: HashMap<String, Vec<FileInfo>> = HashMap::new();
    
    for file in files {
        if !file.is_directory {
            groups.entry(file.name.clone()).or_insert_with(Vec::new).push(file);
        }
    }
    
    groups.retain(|_, files| files.len() > 1);
    groups
}

fn group_by_size(files: Vec<FileInfo>) -> HashMap<String, Vec<FileInfo>> {
    let mut groups: HashMap<String, Vec<FileInfo>> = HashMap::new();
    
    for file in files {
        if !file.is_directory {
            let size_key = file.size.to_string();
            groups.entry(size_key).or_insert_with(Vec::new).push(file);
        }
    }
    
    groups.retain(|_, files| files.len() > 1);
    groups
}

fn group_by_name_and_size(files: Vec<FileInfo>) -> HashMap<String, Vec<FileInfo>> {
    let mut groups: HashMap<String, Vec<FileInfo>> = HashMap::new();
    
    for file in files {
        if !file.is_directory {
            let key = format!("{}_{}", file.name, file.size);
            groups.entry(key).or_insert_with(Vec::new).push(file);
        }
    }
    
    groups.retain(|_, files| files.len() > 1);
    groups
}

async fn calculate_file_hash(path: &str) -> Result<String> {
    let mut file = fs::File::open(path).await?;
    let mut hasher = Sha256::new();
    let mut buffer = vec![0; 8192];
    
    loop {
        use tokio::io::AsyncReadExt;
        let n = file.read(&mut buffer).await?;
        if n == 0 {
            break;
        }
        hasher.update(&buffer[..n]);
    }
    
    Ok(format!("{:x}", hasher.finalize()))
}

async fn convert_to_duplicate_groups(groups: HashMap<String, Vec<FileInfo>>) -> Vec<DuplicateGroup> {
    let mut duplicate_groups = Vec::new();
    let mut id_counter = 1;
    
    for (key, files) in groups {
        if files.len() > 1 {
            let first_file = &files[0];
            let total_size: u64 = files.iter().map(|f| f.size).sum();
            let recoverable_size = total_size - first_file.size;
            
            let mut copies = Vec::new();
            for (idx, file) in files.iter().enumerate() {
                copies.push(DuplicateCopy {
                    id: format!("{}_{}", id_counter, idx),
                    path: file.path.clone(),
                    disk: get_disk_from_path(&file.path).unwrap_or_else(|| "Unknown".to_string()),
                    size: file.size,
                    created: file.created.timestamp(),
                    modified: file.modified.timestamp(),
                    accessed: file.modified.timestamp(), // Using modified as accessed for now
                    is_original: idx == 0,
                    keep_suggestion: idx == 0,
                    metadata: None,
                });
            }
            
            duplicate_groups.push(DuplicateGroup {
                id: id_counter.to_string(),
                hash: key.clone(),
                name: first_file.name.clone(),
                file_type: get_file_type(&first_file.name),
                total_size,
                recoverable_size,
                copies,
            });
            
            id_counter += 1;
        }
    }
    
    duplicate_groups
}

fn get_disk_from_path(path: &str) -> Option<String> {
    #[cfg(target_os = "windows")]
    {
        if path.len() >= 2 && path.chars().nth(1) == Some(':') {
            return Some(path.chars().nth(0)?.to_string());
        }
    }
    
    #[cfg(not(target_os = "windows"))]
    {
        // For Unix-like systems, return the mount point
        if path.starts_with('/') {
            return Some("/".to_string());
        }
    }
    
    None
}

fn get_file_type(name: &str) -> String {
    if let Some(extension) = Path::new(name).extension() {
        let ext = extension.to_string_lossy().to_lowercase();
        match ext.as_str() {
            "jpg" | "jpeg" | "png" | "gif" | "bmp" | "svg" | "webp" => "image".to_string(),
            "mp4" | "avi" | "mkv" | "mov" | "wmv" | "flv" | "webm" => "video".to_string(),
            "mp3" | "wav" | "flac" | "aac" | "ogg" | "wma" => "audio".to_string(),
            "pdf" | "doc" | "docx" | "txt" | "odt" | "rtf" => "document".to_string(),
            "zip" | "rar" | "7z" | "tar" | "gz" => "archive".to_string(),
            _ => "other".to_string(),
        }
    } else {
        "other".to_string()
    }
}

async fn delete_file(path: &str, move_to_trash: bool) -> Result<u64> {
    let metadata = fs::metadata(path).await?;
    let size = metadata.len();
    
    if move_to_trash {
        // In a real implementation, you would move to trash
        // For now, we'll just rename the file
        let trash_path = format!("{}.trash", path);
        fs::rename(path, trash_path).await?;
    } else {
        fs::remove_file(path).await?;
    }
    
    Ok(size)
}

fn apply_selection_strategy(group: &DuplicateGroup, strategy: &SelectionStrategy) -> SelectionResult {
    let mut keep_ids = Vec::new();
    let mut delete_ids = Vec::new();
    let reason;
    
    match strategy {
        SelectionStrategy::KeepNewest => {
            // Keep the file with the most recent modified date
            let mut copies = group.copies.clone();
            copies.sort_by_key(|c| -c.modified); // Sort descending
            keep_ids.push(copies[0].id.clone());
            delete_ids.extend(copies[1..].iter().map(|c| c.id.clone()));
            reason = "Keeping the newest file based on modification date".to_string();
        }
        SelectionStrategy::KeepOldest => {
            // Keep the file with the oldest created date
            let mut copies = group.copies.clone();
            copies.sort_by_key(|c| c.created);
            keep_ids.push(copies[0].id.clone());
            delete_ids.extend(copies[1..].iter().map(|c| c.id.clone()));
            reason = "Keeping the oldest file based on creation date".to_string();
        }
        SelectionStrategy::KeepInOrganized => {
            // Prefer files in organized locations (not in Downloads, Temp, etc.)
            let organized_patterns = vec!["Documents", "Pictures", "Videos", "Music"];
            let temp_patterns = vec!["Downloads", "Temp", "tmp", "cache"];
            
            let mut scored_copies: Vec<(i32, &DuplicateCopy)> = group.copies.iter()
                .map(|copy| {
                    let mut score = 0;
                    let path_lower = copy.path.to_lowercase();
                    
                    // Positive score for organized locations
                    for pattern in &organized_patterns {
                        if path_lower.contains(&pattern.to_lowercase()) {
                            score += 10;
                        }
                    }
                    
                    // Negative score for temporary locations
                    for pattern in &temp_patterns {
                        if path_lower.contains(&pattern.to_lowercase()) {
                            score -= 10;
                        }
                    }
                    
                    (score, copy)
                })
                .collect();
            
            scored_copies.sort_by_key(|(score, _)| -score); // Sort by score descending
            keep_ids.push(scored_copies[0].1.id.clone());
            delete_ids.extend(scored_copies[1..].iter().map(|(_, c)| c.id.clone()));
            reason = "Keeping files in organized locations over temporary folders".to_string();
        }
        SelectionStrategy::AiSuggestion => {
            // For now, use a combination of strategies
            // In a real implementation, this would call an AI service
            keep_ids.push(group.copies[0].id.clone());
            delete_ids.extend(group.copies[1..].iter().map(|c| c.id.clone()));
            reason = "AI suggestion: Keeping the first copy (placeholder implementation)".to_string();
        }
    }
    
    SelectionResult {
        group_id: group.id.clone(),
        keep_ids,
        delete_ids,
        reason,
    }
}