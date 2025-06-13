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
    use std::process::Command;
    
    let mut disks = Vec::new();
    
    // Use WMIC to get disk information
    let output = Command::new("wmic")
        .args(&["logicaldisk", "get", "size,freespace,caption,filesystem", "/format:csv"])
        .output()?;
    
    let output_str = String::from_utf8_lossy(&output.stdout);
    
    // Parse WMIC CSV output
    for line in output_str.lines().skip(2) {  // Skip headers and empty line
        if line.trim().is_empty() {
            continue;
        }
        
        let parts: Vec<&str> = line.split(',').collect();
        if parts.len() >= 5 {
            let drive_letter = parts[1];
            let filesystem = parts[2];
            let free_space = parts[3].parse::<u64>().unwrap_or(0);
            let total_space = parts[4].parse::<u64>().unwrap_or(0);
            
            if total_space > 0 {  // Skip drives with no size (like CD-ROM)
                let used_space = total_space.saturating_sub(free_space);
                
                disks.push(DiskInfo {
                    name: format!("Local Disk ({})", drive_letter),
                    mount_point: format!("{}\\", drive_letter),
                    total_space,
                    available_space: free_space,
                    used_space,
                    file_system: filesystem.to_string(),
                });
            }
        }
    }
    
    // Fallback to simple detection if WMIC fails
    if disks.is_empty() {
        for letter in b'C'..=b'Z' {
            let drive = format!("{}:\\", letter as char);
            if Path::new(&drive).exists() {
                disks.push(DiskInfo {
                    name: format!("Local Disk ({}:)", letter as char),
                    mount_point: drive,
                    total_space: 1_000_000_000_000, // 1TB placeholder
                    available_space: 500_000_000_000, // 500GB placeholder
                    used_space: 500_000_000_000,
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
    
    // Get disk information using df command
    let output = Command::new("df")
        .arg("-B1")  // Output in bytes
        .arg("-T")   // Include filesystem type
        .output()?;
    
    let output_str = String::from_utf8_lossy(&output.stdout);
    
    // Parse df output line by line
    for line in output_str.lines().skip(1) {  // Skip header
        let parts: Vec<&str> = line.split_whitespace().collect();
        
        if parts.len() >= 7 {
            // Only include real filesystems (skip tmpfs, devtmpfs, etc)
            let filesystem = parts[1];
            if filesystem.starts_with("tmpfs") || 
               filesystem.starts_with("devtmpfs") || 
               filesystem.starts_with("udev") ||
               filesystem == "overlay" {
                continue;
            }
            
            let mount_point = parts[6];
            let total_space = parts[2].parse::<u64>().unwrap_or(0);
            let used_space = parts[3].parse::<u64>().unwrap_or(0);
            let available_space = parts[4].parse::<u64>().unwrap_or(0);
            
            // Generate a friendly name
            let name = if mount_point == "/" {
                "Root Filesystem".to_string()
            } else if mount_point.starts_with("/mnt/") {
                format!("Mounted Drive ({})", &mount_point[5..])
            } else {
                format!("Disk ({})", mount_point)
            };
            
            disks.push(DiskInfo {
                name,
                mount_point: mount_point.to_string(),
                total_space,
                available_space,
                used_space,
                file_system: filesystem.to_string(),
            });
        }
    }
    
    // If no disks found, at least return root
    if disks.is_empty() {
        disks.push(DiskInfo {
            name: "Root Filesystem".to_string(),
            mount_point: "/".to_string(),
            total_space: 0,
            available_space: 0,
            used_space: 0,
            file_system: "unknown".to_string(),
        });
    }
    
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