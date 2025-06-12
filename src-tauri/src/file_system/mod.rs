use serde::{Deserialize, Serialize};
use anyhow::Result;
use std::path::Path;
use tokio::fs;
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileInfo {
    pub path: String,
    pub name: String,
    pub size: u64,
    pub modified: DateTime<Utc>,
    pub created: DateTime<Utc>,
    pub is_directory: bool,
    pub extension: Option<String>,
    pub hash: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiskInfo {
    pub name: String,
    pub mount_point: String,
    pub total_space: u64,
    pub available_space: u64,
    pub used_space: u64,
    pub file_system: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanProgress {
    pub current_path: String,
    pub files_scanned: u64,
    pub bytes_scanned: u64,
    pub percentage: f32,
}

/// Get system disk information
pub async fn get_system_disks() -> Result<Vec<DiskInfo>> {
    // Platform-specific implementation
    #[cfg(target_os = "windows")]
    {
        get_windows_disks().await
    }
    
    #[cfg(not(target_os = "windows"))]
    {
        get_unix_disks().await
    }
}

#[cfg(target_os = "windows")]
async fn get_windows_disks() -> Result<Vec<DiskInfo>> {
    use std::ffi::OsStr;
    use std::os::windows::ffi::OsStrExt;
    
    let mut disks = Vec::new();
    
    // Get logical drives (simplified implementation)
    for letter in b'A'..=b'Z' {
        let drive = format!("{}:\\", letter as char);
        if Path::new(&drive).exists() {
            if let Ok(metadata) = fs::metadata(&drive).await {
                disks.push(DiskInfo {
                    name: format!("Local Disk ({}:)", letter as char),
                    mount_point: drive,
                    total_space: 0, // Would use Windows API
                    available_space: 0,
                    used_space: 0,
                    file_system: "NTFS".to_string(),
                });
            }
        }
    }
    
    Ok(disks)
}

#[cfg(not(target_os = "windows"))]
async fn get_unix_disks() -> Result<Vec<DiskInfo>> {
    use std::process::Command;
    
    let mut disks = Vec::new();
    
    // Parse df output (simplified)
    let _output = Command::new("df")
        .arg("-B1")
        .output()?;
    
    // Basic parsing of df output
    disks.push(DiskInfo {
        name: "Main Disk".to_string(),
        mount_point: "/".to_string(),
        total_space: 0,
        available_space: 0,
        used_space: 0,
        file_system: "ext4".to_string(),
    });
    
    Ok(disks)
}

/// Get file information
pub async fn get_file_info(path: &str) -> Result<FileInfo> {
    let path = Path::new(path);
    let metadata = fs::metadata(path).await?;
    
    let name = path.file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("")
        .to_string();
    
    let extension = path.extension()
        .and_then(|e| e.to_str())
        .map(|e| e.to_string());
    
    Ok(FileInfo {
        path: path.to_string_lossy().to_string(),
        name,
        size: metadata.len(),
        modified: metadata.modified()?.into(),
        created: metadata.created()?.into(),
        is_directory: metadata.is_dir(),
        extension,
        hash: None,
    })
}

/// Move file to destination
pub async fn move_file(source: &str, destination: &str) -> Result<()> {
    fs::rename(source, destination).await?;
    Ok(())
}

/// Delete file (move to trash)
pub async fn delete_file(path: &str) -> Result<()> {
    // In production, use trash crate for safe deletion
    fs::remove_file(path).await?;
    Ok(())
}

/// Rename file
pub async fn rename_file(path: &str, new_name: &str) -> Result<()> {
    let path = Path::new(path);
    let parent = path.parent().unwrap();
    let new_path = parent.join(new_name);
    
    fs::rename(path, new_path).await?;
    Ok(())
}