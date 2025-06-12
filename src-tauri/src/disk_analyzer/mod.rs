use serde::{Deserialize, Serialize};
use anyhow::Result;
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::{mpsc, Mutex};
use tokio::fs;
use tokio::io::{AsyncReadExt, BufReader};
use sha2::{Sha256, Digest};
use crate::file_system::FileInfo;
use crate::commands::file_commands::ScanOptions;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ScanType {
    Quick,
    Deep,
    Custom,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DuplicateGroup {
    pub hash: String,
    pub files: Vec<FileInfo>,
    pub total_size: u64,
    pub potential_savings: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanProgress {
    pub total_files: u64,
    pub processed_files: u64,
    pub total_size: u64,
    pub current_path: String,
    pub errors: Vec<String>,
}

pub struct DiskAnalyzer {
    progress: Arc<Mutex<ScanProgress>>,
}

impl DiskAnalyzer {
    pub fn new() -> Self {
        Self {
            progress: Arc::new(Mutex::new(ScanProgress {
                total_files: 0,
                processed_files: 0,
                total_size: 0,
                current_path: String::new(),
                errors: Vec::new(),
            })),
        }
    }
    
    pub async fn get_progress(&self) -> ScanProgress {
        self.progress.lock().await.clone()
    }
    
    /// Scan directory and return file information with real-time progress
    pub async fn scan_directory(
        &self,
        path: &str,
        options: &ScanOptions,
    ) -> Result<Vec<FileInfo>> {
        let path = PathBuf::from(path);
        let (tx, mut rx) = mpsc::channel::<FileInfo>(1000);
        let progress = self.progress.clone();
        let options = options.clone();
        
        // Reset progress
        {
            let mut prog = progress.lock().await;
            prog.total_files = 0;
            prog.processed_files = 0;
            prog.total_size = 0;
            prog.errors.clear();
        }
        
        // Spawn task to scan directory
        let scan_task = tokio::spawn(async move {
            Self::scan_recursive(path, tx, progress, &options).await
        });
        
        // Collect results
        let mut files = Vec::new();
        while let Some(file) = rx.recv().await {
            files.push(file);
        }
        
        // Wait for scan to complete
        scan_task.await??;
        
        Ok(files)
    }
    
    async fn scan_recursive(
        path: PathBuf,
        tx: mpsc::Sender<FileInfo>,
        progress: Arc<Mutex<ScanProgress>>,
        options: &ScanOptions,
    ) -> Result<()> {
        let mut entries = fs::read_dir(&path).await?;
        
        while let Some(entry) = entries.next_entry().await? {
            let path = entry.path();
            let metadata = match entry.metadata().await {
                Ok(m) => m,
                Err(e) => {
                    let mut prog = progress.lock().await;
                    prog.errors.push(format!("Error reading {}: {}", path.display(), e));
                    continue;
                }
            };
            
            // Update current path
            {
                let mut prog = progress.lock().await;
                prog.current_path = path.to_string_lossy().to_string();
            }
            
            // Check excluded patterns
            let path_str = path.to_string_lossy();
            if options.exclude_patterns.iter().any(|p| path_str.contains(p)) {
                continue;
            }
            
            if metadata.is_dir() {
                // Recursively scan subdirectory
                if let Err(e) = Box::pin(Self::scan_recursive(
                    path.clone(),
                    tx.clone(),
                    progress.clone(),
                    options,
                )).await {
                    let mut prog = progress.lock().await;
                    prog.errors.push(format!("Error scanning directory {}: {}", path.display(), e));
                }
            } else if metadata.is_file() {
                // Process file
                let file_info = FileInfo {
                    path: path.to_string_lossy().to_string(),
                    name: path.file_name()
                        .unwrap_or_default()
                        .to_string_lossy()
                        .to_string(),
                    size: metadata.len(),
                    modified: metadata.modified()
                        .unwrap_or(std::time::SystemTime::now())
                        .into(),
                    created: metadata.created()
                        .unwrap_or(std::time::SystemTime::now())
                        .into(),
                    is_directory: false,
                    extension: path.extension()
                        .and_then(|e| e.to_str())
                        .map(|e| e.to_string()),
                    hash: None,
                };
                
                // Update progress
                {
                    let mut prog = progress.lock().await;
                    prog.total_files += 1;
                    prog.processed_files += 1;
                    prog.total_size += metadata.len();
                }
                
                // Send file info
                if tx.send(file_info).await.is_err() {
                    break; // Receiver dropped
                }
            }
        }
        
        Ok(())
    }
    
    /// Find duplicate files
    pub async fn find_duplicates(&self, mut files: Vec<FileInfo>) -> Result<Vec<DuplicateGroup>> {
        let mut hash_groups: HashMap<String, Vec<FileInfo>> = HashMap::new();
        
        // Calculate hashes for all files
        for file in &mut files {
            if let Ok(hash) = self.calculate_file_hash(&file.path).await {
                file.hash = Some(hash.clone());
                hash_groups.entry(hash).or_insert_with(Vec::new).push(file.clone());
            }
        }
        
        // Find groups with duplicates
        let mut duplicate_groups = Vec::new();
        for (hash, group) in hash_groups {
            if group.len() > 1 {
                let total_size: u64 = group.iter().map(|f| f.size).sum();
                let potential_savings = total_size - group[0].size;
                
                duplicate_groups.push(DuplicateGroup {
                    hash,
                    files: group,
                    total_size,
                    potential_savings,
                });
            }
        }
        
        // Sort by potential savings
        duplicate_groups.sort_by(|a, b| b.potential_savings.cmp(&a.potential_savings));
        
        Ok(duplicate_groups)
    }
    
    /// Calculate SHA256 hash for a file
    async fn calculate_file_hash(&self, path: &str) -> Result<String> {
        const BUFFER_SIZE: usize = 65536; // 64KB buffer
        
        let file = fs::File::open(path).await?;
        let mut reader = BufReader::with_capacity(BUFFER_SIZE, file);
        let mut hasher = Sha256::new();
        let mut buffer = vec![0u8; BUFFER_SIZE];
        
        loop {
            let bytes_read = reader.read(&mut buffer).await?;
            if bytes_read == 0 {
                break;
            }
            hasher.update(&buffer[..bytes_read]);
        }
        
        let result = hasher.finalize();
        Ok(format!("{:x}", result))
    }
    
}