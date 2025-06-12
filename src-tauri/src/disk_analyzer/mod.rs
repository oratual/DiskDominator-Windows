use serde::{Deserialize, Serialize};
use anyhow::Result;
use std::collections::HashMap;
use blake3::Hasher;
use tokio::fs::File;
use tokio::io::{AsyncReadExt, BufReader};
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

pub struct DiskAnalyzer {
    // hasher: Hasher, // Removed unused field
}

impl DiskAnalyzer {
    pub fn new() -> Self {
        Self {
            // No fields to initialize
        }
    }
    
    /// Scan directory and return file information
    pub async fn scan_directory(
        &self,
        path: &str,
        options: &ScanOptions,
    ) -> Result<Vec<FileInfo>> {
        use walkdir::WalkDir;
        let mut files = Vec::new();
        
        for entry in WalkDir::new(path)
            .follow_links(false)
            .into_iter()
            .filter_map(|e| e.ok())
        {
            // Skip excluded patterns
            let path_str = entry.path().to_string_lossy();
            if options.exclude_patterns.iter().any(|p| path_str.contains(p)) {
                continue;
            }
            
            if let Ok(metadata) = entry.metadata() {
                if metadata.is_file() {
                    let file_info = FileInfo {
                        path: entry.path().to_string_lossy().to_string(),
                        name: entry.file_name().to_string_lossy().to_string(),
                        size: metadata.len(),
                        modified: metadata.modified()?.into(),
                        created: metadata.created()?.into(),
                        is_directory: false,
                        extension: entry.path()
                            .extension()
                            .and_then(|e| e.to_str())
                            .map(|e| e.to_string()),
                        hash: None,
                    };
                    
                    files.push(file_info);
                }
            }
        }
        
        Ok(files)
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
    
    /// Calculate hash for a file
    async fn calculate_file_hash(&self, path: &str) -> Result<String> {
        let file = File::open(path).await?;
        let mut reader = BufReader::new(file);
        let mut hasher = Hasher::new();
        let mut buffer = vec![0; 8192];
        
        loop {
            let bytes_read = reader.read(&mut buffer).await?;
            if bytes_read == 0 {
                break;
            }
            hasher.update(&buffer[..bytes_read]);
        }
        
        Ok(hasher.finalize().to_hex().to_string())
    }
}