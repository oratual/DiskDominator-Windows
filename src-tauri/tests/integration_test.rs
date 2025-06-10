use disk_dominator::*;
use std::path::PathBuf;

#[tokio::test]
async fn test_disk_scanner_basic() {
    // Create a temporary directory for testing
    let temp_dir = tempfile::tempdir().unwrap();
    let temp_path = temp_dir.path();
    
    // Create some test files
    std::fs::write(temp_path.join("test1.txt"), "Hello World").unwrap();
    std::fs::write(temp_path.join("test2.txt"), "Hello World").unwrap(); // Duplicate
    std::fs::write(temp_path.join("test3.md"), "Different content").unwrap();
    
    // Test scanning
    let analyzer = DiskAnalyzer::new();
    let options = ScanOptions {
        scan_type: ScanType::Quick,
        exclude_patterns: vec![],
    };
    
    let files = analyzer.scan_directory(
        temp_path.to_str().unwrap(),
        &options
    ).await.unwrap();
    
    assert_eq!(files.len(), 3);
    
    // Test duplicate detection
    let duplicates = analyzer.find_duplicates(files).await.unwrap();
    assert_eq!(duplicates.len(), 1); // One group of duplicates
    assert_eq!(duplicates[0].files.len(), 2); // Two files in the group
}

#[tokio::test]
async fn test_storage_module() {
    let storage = StorageModule::new(PathBuf::from("./test_data")).unwrap();
    
    // Test in-memory storage
    let metadata = FileMetadata {
        path: "/test/file.txt".to_string(),
        size: 1024,
        hash: "test_hash".to_string(),
        modified_at: chrono::Utc::now(),
        tags: vec!["test".to_string()],
    };
    
    storage.provider.store_metadata(metadata.clone()).await.unwrap();
    let retrieved = storage.provider.get_metadata("/test/file.txt").await.unwrap();
    
    assert_eq!(retrieved.path, metadata.path);
    assert_eq!(retrieved.hash, metadata.hash);
}

#[test]
fn test_ai_module_creation() {
    // Test creating AI module with mock provider
    let config = AIConfig::default();
    let ai_module = AIModule::new(config);
    
    assert!(ai_module.is_ok());
}

#[test]
fn test_auth_module() {
    let config = AuthConfig::default();
    let auth = AuthModule::new(config);
    
    // Basic creation test
    assert_eq!(auth.get_current_user(), None);
}