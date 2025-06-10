//! Storage module for DiskDominator
//! 
//! Handles persistent storage, caching, and data management

use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use thiserror::Error;

mod cache;
pub use cache::{CacheManager, CachedFileInfo, CachedScanResult};

#[derive(Debug, Error)]
pub enum StorageError {
    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),
    #[error("Serialization error: {0}")]
    SerializationError(String),
    #[error("Database error: {0}")]
    DatabaseError(String),
    #[error("Not found: {0}")]
    NotFound(String),
    #[error("Init error: {0}")]
    InitError(String),
}

/// Configuration for storage module
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StorageConfig {
    pub data_dir: PathBuf,
    pub cache_size_mb: usize,
    pub enable_compression: bool,
}

impl Default for StorageConfig {
    fn default() -> Self {
        Self {
            data_dir: PathBuf::from("./data"),
            cache_size_mb: 100,
            enable_compression: true,
        }
    }
}

/// File metadata stored in the database
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileMetadata {
    pub path: String,
    pub size: u64,
    pub hash: String,
    pub modified_at: chrono::DateTime<chrono::Utc>,
    pub tags: Vec<String>,
}

/// Scan result for a directory
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanResult {
    pub path: String,
    pub total_files: usize,
    pub total_size: u64,
    pub scan_duration: std::time::Duration,
    pub errors: Vec<String>,
}

#[async_trait]
pub trait StorageProvider: Send + Sync {
    /// Initialize the storage provider
    async fn init(&self, config: StorageConfig) -> Result<(), StorageError>;
    
    /// Store file metadata
    async fn store_metadata(&self, metadata: FileMetadata) -> Result<(), StorageError>;
    
    /// Retrieve file metadata by path
    async fn get_metadata(&self, path: &str) -> Result<FileMetadata, StorageError>;
    
    /// Search for files matching criteria
    async fn search(&self, query: &str) -> Result<Vec<FileMetadata>, StorageError>;
    
    /// Store scan results
    async fn store_scan_result(&self, result: ScanResult) -> Result<(), StorageError>;
    
    /// Get latest scan result for a path
    async fn get_latest_scan(&self, path: &str) -> Result<ScanResult, StorageError>;
}

/// In-memory storage provider for testing
pub struct InMemoryStorage {
    metadata: std::sync::Mutex<std::collections::HashMap<String, FileMetadata>>,
    scans: std::sync::Mutex<std::collections::HashMap<String, ScanResult>>,
}

impl InMemoryStorage {
    pub fn new() -> Self {
        Self {
            metadata: std::sync::Mutex::new(std::collections::HashMap::new()),
            scans: std::sync::Mutex::new(std::collections::HashMap::new()),
        }
    }
}

#[async_trait]
impl StorageProvider for InMemoryStorage {
    async fn init(&self, _config: StorageConfig) -> Result<(), StorageError> {
        Ok(())
    }
    
    async fn store_metadata(&self, metadata: FileMetadata) -> Result<(), StorageError> {
        let mut storage = self.metadata.lock().unwrap();
        storage.insert(metadata.path.clone(), metadata);
        Ok(())
    }
    
    async fn get_metadata(&self, path: &str) -> Result<FileMetadata, StorageError> {
        let storage = self.metadata.lock().unwrap();
        storage.get(path)
            .cloned()
            .ok_or_else(|| StorageError::NotFound(path.to_string()))
    }
    
    async fn search(&self, query: &str) -> Result<Vec<FileMetadata>, StorageError> {
        let storage = self.metadata.lock().unwrap();
        Ok(storage.values()
            .filter(|m| m.path.contains(query))
            .cloned()
            .collect())
    }
    
    async fn store_scan_result(&self, result: ScanResult) -> Result<(), StorageError> {
        let mut scans = self.scans.lock().unwrap();
        scans.insert(result.path.clone(), result);
        Ok(())
    }
    
    async fn get_latest_scan(&self, path: &str) -> Result<ScanResult, StorageError> {
        let scans = self.scans.lock().unwrap();
        scans.get(path)
            .cloned()
            .ok_or_else(|| StorageError::NotFound(path.to_string()))
    }
}

/// Main storage module that integrates cache and file storage
pub struct StorageModule {
    cache: Option<CacheManager>,
    provider: Box<dyn StorageProvider>,
    config: StorageConfig,
}

impl StorageModule {
    pub fn new(data_dir: PathBuf) -> Result<Self, StorageError> {
        let config = StorageConfig {
            data_dir,
            ..Default::default()
        };
        
        Ok(Self {
            cache: None,
            provider: Box::new(InMemoryStorage::new()),
            config,
        })
    }
    
    pub async fn init_cache(&mut self, app_name: &str) -> Result<(), StorageError> {
        self.cache = Some(CacheManager::new(app_name).await?);
        Ok(())
    }
    
    pub async fn get_cached_files(&self) -> Result<Vec<FileMetadata>, StorageError> {
        // For now, return from in-memory storage
        self.provider.search("").await
    }
    
    pub fn cache_manager(&self) -> Option<&CacheManager> {
        self.cache.as_ref()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_in_memory_storage() {
        let storage = InMemoryStorage::new();
        storage.init(StorageConfig::default()).await.unwrap();
        
        let metadata = FileMetadata {
            path: "/test/file.txt".to_string(),
            size: 1024,
            hash: "abc123".to_string(),
            modified_at: chrono::Utc::now(),
            tags: vec!["test".to_string()],
        };
        
        storage.store_metadata(metadata.clone()).await.unwrap();
        let retrieved = storage.get_metadata("/test/file.txt").await.unwrap();
        assert_eq!(retrieved.path, metadata.path);
    }
}