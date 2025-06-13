use serde::{Deserialize, Serialize};
use tauri::State;
use anyhow::Result;
use crate::app_state::AppState;
use crate::file_system::FileInfo;
use std::collections::HashMap;
use std::path::Path;
use std::sync::Arc;
use tokio::fs;
// use std::io::Write; // Not needed for current implementation

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LargeFileInfo {
    pub id: String,
    pub path: String,
    pub name: String,
    pub size: u64,
    pub file_type: String,
    pub extension: String,
    pub created: i64,
    pub modified: i64,
    pub accessed: i64,
    pub disk: String,
    pub compression_potential: f64,
    pub last_opened: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LargeFileFilter {
    pub min_size: Option<u64>,
    pub max_size: Option<u64>,
    pub paths: Option<Vec<String>>,
    pub file_types: Option<Vec<String>>,
    pub extensions: Option<Vec<String>>,
    pub sort_by: Option<String>,
    pub sort_order: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SpaceAnalysis {
    pub total_size: u64,
    pub file_count: usize,
    pub by_type: HashMap<String, SpaceByType>,
    pub by_disk: HashMap<String, u64>,
    pub size_distribution: SizeDistribution,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SpaceByType {
    pub size: u64,
    pub count: usize,
    pub percentage: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SizeDistribution {
    pub tiny: usize,      // < 1MB
    pub small: usize,     // 1MB - 10MB
    pub medium: usize,    // 10MB - 100MB
    pub large: usize,     // 100MB - 1GB
    pub huge: usize,      // 1GB - 10GB
    pub gigantic: usize,  // > 10GB
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompressionOptions {
    pub format: CompressionFormat,
    pub level: CompressionLevel,
    pub keep_original: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum CompressionFormat {
    Zip,
    Tar,
    TarGz,
    SevenZ,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum CompressionLevel {
    Fast,
    Normal,
    Best,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompressionResult {
    pub original_size: u64,
    pub compressed_size: u64,
    pub compression_ratio: f64,
    pub output_path: String,
    pub time_taken: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FilePreview {
    pub path: String,
    pub preview_type: String,
    pub content: Option<String>,
    pub metadata: HashMap<String, serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchDeleteResult {
    pub deleted: Vec<String>,
    pub failed: Vec<FailedOperation>,
    pub space_freed: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FailedOperation {
    pub id: String,
    pub path: String,
    pub error: String,
}

/// Find large files with advanced filtering
#[tauri::command]
pub async fn find_large_files(
    filter: LargeFileFilter,
    state: State<'_, Arc<AppState>>,
) -> Result<Vec<LargeFileInfo>, String> {
    // Log scan start activity
    crate::commands::home_commands::log_activity(
        state.inner(),
        "Búsqueda de archivos grandes iniciada".to_string(),
        format!("Filtro: min_size={:?}, max_size={:?}", 
            filter.min_size, filter.max_size),
        crate::commands::home_commands::ActivityType::ScanStarted,
        "running".to_string(),
        None,
    ).await;
    let storage = state.storage.read().await;
    let mut large_files = Vec::new();
    
    // Collect all files from scan results
    for (scan_path, files) in storage.scan_results.iter() {
        // Filter by paths if specified
        if let Some(ref paths) = filter.paths {
            if !paths.iter().any(|p| scan_path.starts_with(p)) {
                continue;
            }
        }
        
        for file in files {
            if file.is_directory {
                continue;
            }
            
            // Apply size filters
            if let Some(min_size) = filter.min_size {
                if file.size < min_size {
                    continue;
                }
            }
            
            if let Some(max_size) = filter.max_size {
                if file.size > max_size {
                    continue;
                }
            }
            
            let file_type = get_file_type(&file.name);
            let extension = get_file_extension(&file.name);
            
            // Apply file type filter
            if let Some(ref types) = filter.file_types {
                if !types.contains(&file_type) {
                    continue;
                }
            }
            
            // Apply extension filter
            if let Some(ref extensions) = filter.extensions {
                if !extensions.contains(&extension) {
                    continue;
                }
            }
            
            large_files.push(LargeFileInfo {
                id: format!("{:x}", md5::compute(&file.path)),
                path: file.path.clone(),
                name: file.name.clone(),
                size: file.size,
                file_type: file_type.clone(),
                extension: extension.clone(),
                created: file.created.timestamp(),
                modified: file.modified.timestamp(),
                accessed: file.modified.timestamp(), // Using modified as accessed for now
                disk: get_disk_from_path(&file.path).unwrap_or_else(|| "Unknown".to_string()),
                compression_potential: estimate_compression_potential(&file_type, &extension),
                last_opened: None, // Would need tracking system for this
            });
        }
    }
    
    // Sort results
    sort_large_files(&mut large_files, &filter.sort_by, &filter.sort_order);
    
    // Log scan completion activity
    let total_size: u64 = large_files.iter().map(|f| f.size).sum();
    crate::commands::home_commands::log_activity(
        state.inner(),
        "Búsqueda de archivos grandes completada".to_string(),
        format!("{} archivos encontrados", large_files.len()),
        crate::commands::home_commands::ActivityType::ScanCompleted,
        "completed".to_string(),
        Some(crate::commands::home_commands::ActivityMetadata {
            size: Some(total_size),
            count: Some(large_files.len() as u32),
            duration: None,
            error: None,
        }),
    ).await;
    
    Ok(large_files)
}

/// Analyze space usage of files
#[tauri::command]
pub async fn get_file_space_analysis(
    paths: Option<Vec<String>>,
    state: State<'_, Arc<AppState>>,
) -> Result<SpaceAnalysis, String> {
    let storage = state.storage.read().await;
    let mut total_size = 0u64;
    let mut file_count = 0usize;
    let mut by_type: HashMap<String, SpaceByType> = HashMap::new();
    let mut by_disk: HashMap<String, u64> = HashMap::new();
    let mut size_distribution = SizeDistribution {
        tiny: 0,
        small: 0,
        medium: 0,
        large: 0,
        huge: 0,
        gigantic: 0,
    };
    
    // Analyze all files
    for (scan_path, files) in storage.scan_results.iter() {
        // Filter by paths if specified
        if let Some(ref filter_paths) = paths {
            if !filter_paths.iter().any(|p| scan_path.starts_with(p)) {
                continue;
            }
        }
        
        for file in files {
            if file.is_directory {
                continue;
            }
            
            total_size += file.size;
            file_count += 1;
            
            // Group by file type
            let file_type = get_file_type(&file.name);
            let type_entry = by_type.entry(file_type).or_insert(SpaceByType {
                size: 0,
                count: 0,
                percentage: 0.0,
            });
            type_entry.size += file.size;
            type_entry.count += 1;
            
            // Group by disk
            if let Some(disk) = get_disk_from_path(&file.path) {
                *by_disk.entry(disk).or_insert(0) += file.size;
            }
            
            // Size distribution
            match file.size {
                s if s < 1_048_576 => size_distribution.tiny += 1,                    // < 1MB
                s if s < 10_485_760 => size_distribution.small += 1,                  // 1MB - 10MB
                s if s < 104_857_600 => size_distribution.medium += 1,                // 10MB - 100MB
                s if s < 1_073_741_824 => size_distribution.large += 1,               // 100MB - 1GB
                s if s < 10_737_418_240 => size_distribution.huge += 1,               // 1GB - 10GB
                _ => size_distribution.gigantic += 1,                                  // > 10GB
            }
        }
    }
    
    // Calculate percentages
    if total_size > 0 {
        for type_info in by_type.values_mut() {
            type_info.percentage = (type_info.size as f64 / total_size as f64) * 100.0;
        }
    }
    
    Ok(SpaceAnalysis {
        total_size,
        file_count,
        by_type,
        by_disk,
        size_distribution,
    })
}

/// Compress a file using the specified format
#[tauri::command]
pub async fn compress_file(
    file_path: String,
    options: CompressionOptions,
) -> Result<CompressionResult, String> {
    let start_time = std::time::Instant::now();
    
    // Get original file info
    let metadata = fs::metadata(&file_path).await
        .map_err(|e| format!("Failed to read file metadata: {}", e))?;
    let original_size = metadata.len();
    
    // Generate output path
    let output_path = generate_compressed_path(&file_path, &options.format);
    
    // Perform compression based on format
    let compressed_size = match options.format {
        CompressionFormat::Zip => compress_to_zip(&file_path, &output_path, &options.level).await?,
        CompressionFormat::Tar => compress_to_tar(&file_path, &output_path).await?,
        CompressionFormat::TarGz => compress_to_tar_gz(&file_path, &output_path, &options.level).await?,
        CompressionFormat::SevenZ => {
            return Err("7z compression not yet implemented".to_string());
        }
    };
    
    // Delete original if requested
    if !options.keep_original {
        fs::remove_file(&file_path).await
            .map_err(|e| format!("Failed to delete original file: {}", e))?;
    }
    
    let time_taken = start_time.elapsed().as_millis() as u64;
    let compression_ratio = if original_size > 0 {
        (1.0 - (compressed_size as f64 / original_size as f64)) * 100.0
    } else {
        0.0
    };
    
    Ok(CompressionResult {
        original_size,
        compressed_size,
        compression_ratio,
        output_path,
        time_taken,
    })
}

/// Generate a preview for a file
#[tauri::command]
pub async fn generate_file_preview(
    file_path: String,
) -> Result<FilePreview, String> {
    let metadata = fs::metadata(&file_path).await
        .map_err(|e| format!("Failed to read file metadata: {}", e))?;
    
    let mut preview_metadata = HashMap::new();
    preview_metadata.insert("size".to_string(), serde_json::Value::Number(metadata.len().into()));
    
    let file_type = get_file_type(&file_path);
    let extension = get_file_extension(&file_path);
    
    let (preview_type, content) = match file_type.as_str() {
        "text" | "code" => {
            // Read first 1000 characters for text files
            let content = read_text_preview(&file_path, 1000).await?;
            ("text".to_string(), Some(content))
        }
        "image" => {
            // For images, we'll just return metadata for now
            preview_metadata.insert("type".to_string(), serde_json::Value::String("image".to_string()));
            preview_metadata.insert("extension".to_string(), serde_json::Value::String(extension));
            ("image".to_string(), None)
        }
        "video" | "audio" => {
            // For media files, return basic metadata
            preview_metadata.insert("type".to_string(), serde_json::Value::String(file_type.clone()));
            preview_metadata.insert("extension".to_string(), serde_json::Value::String(extension));
            ("media".to_string(), None)
        }
        _ => {
            // For other files, just return basic info
            preview_metadata.insert("type".to_string(), serde_json::Value::String("binary".to_string()));
            ("binary".to_string(), None)
        }
    };
    
    Ok(FilePreview {
        path: file_path,
        preview_type,
        content,
        metadata: preview_metadata,
    })
}

/// Delete multiple large files in batch
#[tauri::command]
pub async fn delete_large_files_batch(
    file_ids: Vec<String>,
    move_to_trash: bool,
    state: State<'_, Arc<AppState>>,
) -> Result<BatchDeleteResult, String> {
    let mut deleted = Vec::new();
    let mut failed = Vec::new();
    let mut space_freed = 0u64;
    
    // Get file info from storage to map IDs to paths
    let storage = state.storage.read().await;
    let mut id_to_file: HashMap<String, FileInfo> = HashMap::new();
    
    for files in storage.scan_results.values() {
        for file in files {
            let file_id = format!("{:x}", md5::compute(&file.path));
            if file_ids.contains(&file_id) {
                id_to_file.insert(file_id, file.clone());
            }
        }
    }
    
    // Delete each file
    for file_id in file_ids {
        if let Some(file_info) = id_to_file.get(&file_id) {
            match delete_file(&file_info.path, move_to_trash).await {
                Ok(size) => {
                    deleted.push(file_id);
                    space_freed += size;
                }
                Err(e) => {
                    failed.push(FailedOperation {
                        id: file_id,
                        path: file_info.path.clone(),
                        error: e.to_string(),
                    });
                }
            }
        } else {
            failed.push(FailedOperation {
                id: file_id.clone(),
                path: String::new(),
                error: "File not found in scan results".to_string(),
            });
        }
    }
    
    // Log deletion activity if any files were deleted
    if !deleted.is_empty() {
        crate::commands::home_commands::log_activity(
            state.inner(),
            "Archivos eliminados".to_string(),
            format!("{} archivos eliminados", deleted.len()),
            crate::commands::home_commands::ActivityType::FilesDeleted,
            "completed".to_string(),
            Some(crate::commands::home_commands::ActivityMetadata {
                size: Some(space_freed),
                count: Some(deleted.len() as u32),
                duration: None,
                error: None,
            }),
        ).await;
    }

    Ok(BatchDeleteResult {
        deleted,
        failed,
        space_freed,
    })
}

// Helper functions

fn get_file_type(name: &str) -> String {
    if let Some(extension) = Path::new(name).extension() {
        let ext = extension.to_string_lossy().to_lowercase();
        match ext.as_str() {
            "jpg" | "jpeg" | "png" | "gif" | "bmp" | "svg" | "webp" | "ico" | "tiff" => "image".to_string(),
            "mp4" | "avi" | "mkv" | "mov" | "wmv" | "flv" | "webm" | "m4v" | "mpg" | "mpeg" => "video".to_string(),
            "mp3" | "wav" | "flac" | "aac" | "ogg" | "wma" | "m4a" | "opus" => "audio".to_string(),
            "pdf" | "doc" | "docx" | "txt" | "odt" | "rtf" | "tex" => "document".to_string(),
            "xls" | "xlsx" | "csv" | "ods" => "spreadsheet".to_string(),
            "ppt" | "pptx" | "odp" => "presentation".to_string(),
            "zip" | "rar" | "7z" | "tar" | "gz" | "bz2" | "xz" => "archive".to_string(),
            "exe" | "msi" | "app" | "deb" | "rpm" | "dmg" | "pkg" => "executable".to_string(),
            "js" | "ts" | "py" | "java" | "c" | "cpp" | "rs" | "go" | "rb" | "php" | "swift" | 
            "kt" | "scala" | "r" | "m" | "h" | "sh" | "bat" | "ps1" => "code".to_string(),
            "json" | "xml" | "yaml" | "yml" | "toml" | "ini" | "conf" | "cfg" => "config".to_string(),
            "sql" | "db" | "sqlite" => "database".to_string(),
            "log" | "out" | "err" => "log".to_string(),
            "md" | "markdown" | "rst" | "adoc" => "markdown".to_string(),
            "html" | "htm" | "css" | "scss" | "sass" | "less" => "web".to_string(),
            _ => "other".to_string(),
        }
    } else {
        "other".to_string()
    }
}

fn get_file_extension(name: &str) -> String {
    Path::new(name)
        .extension()
        .and_then(|e| e.to_str())
        .map(|e| e.to_lowercase())
        .unwrap_or_else(|| String::new())
}

fn get_disk_from_path(path: &str) -> Option<String> {
    #[cfg(target_os = "windows")]
    {
        if path.len() >= 2 && path.chars().nth(1) == Some(':') {
            return Some(format!("{}:", path.chars().nth(0)?));
        }
    }
    
    #[cfg(not(target_os = "windows"))]
    {
        // For Unix-like systems, return the mount point
        if path.starts_with('/') {
            // This is a simplified version - in production you'd want to check actual mount points
            if path.starts_with("/mnt/") || path.starts_with("/media/") {
                let parts: Vec<&str> = path.split('/').collect();
                if parts.len() > 2 {
                    return Some(format!("/{}/{}", parts[1], parts[2]));
                }
            }
            return Some("/".to_string());
        }
    }
    
    None
}

fn estimate_compression_potential(file_type: &str, extension: &str) -> f64 {
    // Estimate compression potential based on file type
    match file_type {
        "text" | "code" | "log" | "markdown" | "config" => 0.7,  // 70% potential reduction
        "document" | "spreadsheet" | "presentation" => 0.5,       // 50% potential reduction
        "database" => 0.6,                                        // 60% potential reduction
        "web" => 0.4,                                            // 40% potential reduction
        "image" => {
            match extension {
                "bmp" | "tiff" => 0.7,                           // Uncompressed formats
                "png" => 0.2,                                     // Already compressed
                "jpg" | "jpeg" => 0.1,                           // Already compressed
                _ => 0.3,
            }
        }
        "video" | "audio" => 0.1,                                 // Already compressed
        "archive" => 0.05,                                        // Already compressed
        "executable" => 0.3,                                      // Some potential
        _ => 0.4,                                                 // Default estimate
    }
}

fn sort_large_files(files: &mut Vec<LargeFileInfo>, sort_by: &Option<String>, sort_order: &Option<String>) {
    let ascending = sort_order.as_ref().map(|o| o == "asc").unwrap_or(false);
    
    match sort_by.as_ref().map(|s| s.as_str()) {
        Some("size") => {
            if ascending {
                files.sort_by_key(|f| f.size);
            } else {
                files.sort_by_key(|f| std::cmp::Reverse(f.size));
            }
        }
        Some("name") => {
            if ascending {
                files.sort_by(|a, b| a.name.cmp(&b.name));
            } else {
                files.sort_by(|a, b| b.name.cmp(&a.name));
            }
        }
        Some("modified") => {
            if ascending {
                files.sort_by_key(|f| f.modified);
            } else {
                files.sort_by_key(|f| std::cmp::Reverse(f.modified));
            }
        }
        Some("type") => {
            if ascending {
                files.sort_by(|a, b| a.file_type.cmp(&b.file_type));
            } else {
                files.sort_by(|a, b| b.file_type.cmp(&a.file_type));
            }
        }
        _ => {
            // Default to size descending
            files.sort_by_key(|f| std::cmp::Reverse(f.size));
        }
    }
}

async fn delete_file(path: &str, move_to_trash: bool) -> Result<u64> {
    let metadata = fs::metadata(path).await?;
    let size = metadata.len();
    
    if move_to_trash {
        // In a real implementation, you would use a proper trash library
        // For now, we'll just rename the file
        let trash_path = format!("{}.trash", path);
        fs::rename(path, trash_path).await?;
    } else {
        fs::remove_file(path).await?;
    }
    
    Ok(size)
}

async fn read_text_preview(path: &str, max_chars: usize) -> Result<String, String> {
    use tokio::io::AsyncReadExt;
    
    let mut file = fs::File::open(path).await
        .map_err(|e| format!("Failed to open file: {}", e))?;
    
    let mut buffer = vec![0; max_chars];
    let n = file.read(&mut buffer).await
        .map_err(|e| format!("Failed to read file: {}", e))?;
    
    String::from_utf8(buffer[..n].to_vec())
        .map_err(|_| "File is not valid UTF-8 text".to_string())
}

fn generate_compressed_path(original_path: &str, format: &CompressionFormat) -> String {
    let extension = match format {
        CompressionFormat::Zip => "zip",
        CompressionFormat::Tar => "tar",
        CompressionFormat::TarGz => "tar.gz",
        CompressionFormat::SevenZ => "7z",
    };
    
    format!("{}.{}", original_path, extension)
}

async fn compress_to_zip(file_path: &str, output_path: &str, level: &CompressionLevel) -> Result<u64, String> {
    use std::io::{Read, Write};
    use zip::write::FileOptions;
    
    let file = std::fs::File::open(file_path)
        .map_err(|e| format!("Failed to open source file: {}", e))?;
    
    let output_file = std::fs::File::create(output_path)
        .map_err(|e| format!("Failed to create output file: {}", e))?;
    
    let mut zip = zip::ZipWriter::new(output_file);
    
    let options = match level {
        CompressionLevel::Fast => FileOptions::default().compression_method(zip::CompressionMethod::Stored),
        CompressionLevel::Normal => FileOptions::default(),
        CompressionLevel::Best => FileOptions::default().compression_method(zip::CompressionMethod::Deflated),
    };
    
    let file_name = Path::new(file_path)
        .file_name()
        .ok_or("Invalid file name")?
        .to_string_lossy();
    
    zip.start_file(file_name, options)
        .map_err(|e| format!("Failed to start zip file: {}", e))?;
    
    let mut buffer = Vec::new();
    let mut file = file;
    file.read_to_end(&mut buffer)
        .map_err(|e| format!("Failed to read file: {}", e))?;
    
    zip.write_all(&buffer)
        .map_err(|e| format!("Failed to write to zip: {}", e))?;
    
    zip.finish()
        .map_err(|e| format!("Failed to finish zip: {}", e))?;
    
    let metadata = std::fs::metadata(output_path)
        .map_err(|e| format!("Failed to get output file metadata: {}", e))?;
    
    Ok(metadata.len())
}

async fn compress_to_tar(file_path: &str, output_path: &str) -> Result<u64, String> {
    use tar::Builder;
    
    let output_file = std::fs::File::create(output_path)
        .map_err(|e| format!("Failed to create output file: {}", e))?;
    
    let mut tar = Builder::new(output_file);
    
    let file_name = Path::new(file_path)
        .file_name()
        .ok_or("Invalid file name")?;
    
    tar.append_path_with_name(file_path, file_name)
        .map_err(|e| format!("Failed to add file to tar: {}", e))?;
    
    tar.finish()
        .map_err(|e| format!("Failed to finish tar: {}", e))?;
    
    let metadata = std::fs::metadata(output_path)
        .map_err(|e| format!("Failed to get output file metadata: {}", e))?;
    
    Ok(metadata.len())
}

async fn compress_to_tar_gz(file_path: &str, output_path: &str, level: &CompressionLevel) -> Result<u64, String> {
    use flate2::write::GzEncoder;
    use flate2::Compression;
    use tar::Builder;
    
    let output_file = std::fs::File::create(output_path)
        .map_err(|e| format!("Failed to create output file: {}", e))?;
    
    let compression = match level {
        CompressionLevel::Fast => Compression::fast(),
        CompressionLevel::Normal => Compression::default(),
        CompressionLevel::Best => Compression::best(),
    };
    
    let gz = GzEncoder::new(output_file, compression);
    let mut tar = Builder::new(gz);
    
    let file_name = Path::new(file_path)
        .file_name()
        .ok_or("Invalid file name")?;
    
    tar.append_path_with_name(file_path, file_name)
        .map_err(|e| format!("Failed to add file to tar: {}", e))?;
    
    let gz = tar.into_inner()
        .map_err(|e| format!("Failed to get gz encoder: {}", e))?;
    
    gz.finish()
        .map_err(|e| format!("Failed to finish compression: {}", e))?;
    
    let metadata = std::fs::metadata(output_path)
        .map_err(|e| format!("Failed to get output file metadata: {}", e))?;
    
    Ok(metadata.len())
}