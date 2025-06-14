// Simplified MFT scanner for Windows compilation
use anyhow::Result;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MftFileRecord {
    pub path: String,
    pub name: String,
    pub size: u64,
    pub modified: u64,
    pub created: u64,
    pub is_directory: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MftScanResult {
    pub files: Vec<MftFileRecord>,
    pub total_files: usize,
    pub scan_duration_ms: u64,
}

pub struct MftScanner;

impl MftScanner {
    pub fn is_mft_available() -> bool {
        // On Windows, MFT is available for NTFS drives
        #[cfg(target_os = "windows")]
        return true;

        #[cfg(not(target_os = "windows"))]
        return false;
    }

    pub async fn scan_mft(drive_letter: &str) -> Result<MftScanResult> {
        let start = std::time::Instant::now();

        // For now, use a simple fallback method
        let files = Self::scan_via_walkdir(drive_letter).await?;

        Ok(MftScanResult {
            total_files: files.len(),
            files,
            scan_duration_ms: start.elapsed().as_millis() as u64,
        })
    }

    async fn scan_via_walkdir(drive_letter: &str) -> Result<Vec<MftFileRecord>> {
        use std::time::SystemTime;
        use walkdir::WalkDir;

        let path = format!("{}:\\", drive_letter);

        // Use spawn_blocking for file system operations
        let files = tokio::task::spawn_blocking(move || {
            let mut collected_files = Vec::new();

            for entry in WalkDir::new(&path)
                .min_depth(0)
                .max_depth(3) // Limit depth for faster scanning
                .follow_links(false)
            {
                if let Ok(entry) = entry {
                    if let Ok(metadata) = entry.metadata() {
                        if !metadata.is_dir() && metadata.len() > 1024 * 1024 {
                            // Only files > 1MB
                            let modified = metadata
                                .modified()
                                .unwrap_or(SystemTime::UNIX_EPOCH)
                                .duration_since(SystemTime::UNIX_EPOCH)
                                .unwrap_or_default()
                                .as_secs();

                            let created = metadata
                                .created()
                                .unwrap_or(SystemTime::UNIX_EPOCH)
                                .duration_since(SystemTime::UNIX_EPOCH)
                                .unwrap_or_default()
                                .as_secs();

                            collected_files.push(MftFileRecord {
                                path: entry.path().to_string_lossy().to_string(),
                                name: entry.file_name().to_string_lossy().to_string(),
                                size: metadata.len(),
                                modified,
                                created,
                                is_directory: false,
                            });

                            // Limit to prevent memory issues
                            if collected_files.len() >= 10000 {
                                break;
                            }
                        }
                    }
                }
            }

            collected_files
        })
        .await?;

        if files.is_empty() {
            return Err(anyhow::anyhow!("No files found on drive {}", drive_letter));
        }

        Ok(files)
    }
}
