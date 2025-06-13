use std::fs;
use tempfile::TempDir;

// Integration tests for DiskDominator backend
mod integration_tests {
    use super::*;
    use disk_dominator::{DiskAnalyzer, ScanConfig, ScanType, DuplicateStrategy, WebSocketManager, FileInfo};
    use std::sync::Arc;

    #[tokio::test]
    async fn test_disk_analyzer_creation() {
        let websocket_manager = Arc::new(WebSocketManager::new());
        let analyzer = DiskAnalyzer::new(websocket_manager);
        
        // Test that analyzer is created successfully
        assert!(analyzer.get_active_sessions().await.is_empty());
    }

    #[tokio::test]
    async fn test_scan_session_lifecycle() {
        let websocket_manager = Arc::new(WebSocketManager::new());
        let analyzer = DiskAnalyzer::new(websocket_manager);
        
        let config = ScanConfig {
            exclude_patterns: vec!["test".to_string()],
            include_hidden: false,
            follow_symlinks: false,
            max_depth: None,
            min_file_size: None,
            max_file_size: None,
            calculate_hashes: false,
            quick_hash_threshold: 1024 * 1024,
            duplicate_strategy: DuplicateStrategy::NameAndSize,
            large_file_threshold: 100 * 1024 * 1024,
        };
        
        // Create session
        let session_id = analyzer.create_scan_session(
            "/tmp".to_string(),
            ScanType::Quick,
            config,
        ).await.expect("Failed to create session");
        
        // Verify session exists
        let session = analyzer.get_scan_session(&session_id).await;
        assert!(session.is_some());
        
        let session = session.unwrap();
        assert_eq!(session.disk_path, "/tmp");
        assert!(matches!(session.scan_type, ScanType::Quick));
        
        // Test pause
        analyzer.pause_scan_session(&session_id).await.expect("Failed to pause");
        
        // Test resume
        analyzer.resume_scan_session(&session_id).await.expect("Failed to resume");
        
        // Test cancel
        analyzer.cancel_scan_session(&session_id).await.expect("Failed to cancel");
    }

    #[tokio::test]
    async fn test_duplicate_detection_name_size() {
        let websocket_manager = Arc::new(WebSocketManager::new());
        let analyzer = DiskAnalyzer::new(websocket_manager);
        
        // Create test files data
        let files = vec![
            FileInfo {
                path: "/test/file1.txt".to_string(),
                name: "duplicate.txt".to_string(),
                size: 1024,
                modified: chrono::Utc::now(),
                created: chrono::Utc::now(),
                is_directory: false,
                extension: Some("txt".to_string()),
                hash: None,
            },
            FileInfo {
                path: "/test/file2.txt".to_string(),
                name: "duplicate.txt".to_string(),
                size: 1024,
                modified: chrono::Utc::now(),
                created: chrono::Utc::now(),
                is_directory: false,
                extension: Some("txt".to_string()),
                hash: None,
            },
            FileInfo {
                path: "/test/unique.txt".to_string(),
                name: "unique.txt".to_string(),
                size: 2048,
                modified: chrono::Utc::now(),
                created: chrono::Utc::now(),
                is_directory: false,
                extension: Some("txt".to_string()),
                hash: None,
            },
        ];
        
        let duplicates = analyzer.find_duplicates_by_name_size(&files).await.expect("Failed to find duplicates");
        
        // Should find one duplicate group with 2 files
        assert_eq!(duplicates.len(), 1);
        assert_eq!(duplicates[0].files.len(), 2);
        assert_eq!(duplicates[0].potential_savings, 1024); // Total size - first file size
    }

    #[tokio::test]
    async fn test_large_file_analysis() {
        let websocket_manager = Arc::new(WebSocketManager::new());
        let analyzer = DiskAnalyzer::new(websocket_manager);
        
        let config = ScanConfig {
            exclude_patterns: vec![],
            include_hidden: false,
            follow_symlinks: false,
            max_depth: None,
            min_file_size: None,
            max_file_size: None,
            calculate_hashes: false,
            quick_hash_threshold: 1024 * 1024,
            duplicate_strategy: DuplicateStrategy::NameAndSize,
            large_file_threshold: 50 * 1024 * 1024, // 50MB threshold for testing
        };
        
        let files = vec![
            FileInfo {
                path: "/test/small.txt".to_string(),
                name: "small.txt".to_string(),
                size: 1024, // 1KB - below threshold
                modified: chrono::Utc::now(),
                created: chrono::Utc::now(),
                is_directory: false,
                extension: Some("txt".to_string()),
                hash: None,
            },
            FileInfo {
                path: "/test/large_video.mp4".to_string(),
                name: "large_video.mp4".to_string(),
                size: 100 * 1024 * 1024, // 100MB - above threshold
                modified: chrono::Utc::now(),
                created: chrono::Utc::now(),
                is_directory: false,
                extension: Some("mp4".to_string()),
                hash: None,
            },
            FileInfo {
                path: "/test/huge_archive.zip".to_string(),
                name: "huge_archive.zip".to_string(),
                size: 500 * 1024 * 1024, // 500MB - above threshold
                modified: chrono::Utc::now(),
                created: chrono::Utc::now(),
                is_directory: false,
                extension: Some("zip".to_string()),
                hash: None,
            },
        ];
        
        let large_files = analyzer.analyze_large_files(&files, &config).await;
        
        // Should only include files above threshold, sorted by size
        assert_eq!(large_files.len(), 2);
        assert_eq!(large_files[0].name, "huge_archive.zip"); // Largest first
        assert_eq!(large_files[1].name, "large_video.mp4");
    }

    #[tokio::test]
    async fn test_file_categorization() {
        let websocket_manager = Arc::new(WebSocketManager::new());
        let analyzer = DiskAnalyzer::new(websocket_manager);
        
        // Test various file extensions
        assert_eq!(analyzer.categorize_file("video.mp4", &Some("mp4".to_string())), "videos");
        assert_eq!(analyzer.categorize_file("archive.zip", &Some("zip".to_string())), "archives");
        assert_eq!(analyzer.categorize_file("database.sqlite", &Some("sqlite".to_string())), "databases");
        assert_eq!(analyzer.categorize_file("image.jpg", &Some("jpg".to_string())), "images");
        assert_eq!(analyzer.categorize_file("document.pdf", &Some("pdf".to_string())), "documents");
        assert_eq!(analyzer.categorize_file("program.exe", &Some("exe".to_string())), "executables");
        
        // Test name-based categorization
        assert_eq!(analyzer.categorize_file("backup_file.dat", &None), "archives");
        assert_eq!(analyzer.categorize_file("temp_cache.tmp", &None), "other");
        assert_eq!(analyzer.categorize_file("unknown.xyz", &Some("xyz".to_string())), "other");
    }

    #[tokio::test]
    async fn test_smart_duplicate_detection() {
        let websocket_manager = Arc::new(WebSocketManager::new());
        let analyzer = DiskAnalyzer::new(websocket_manager);
        
        let config = ScanConfig {
            exclude_patterns: vec![],
            include_hidden: false,
            follow_symlinks: false,
            max_depth: None,
            min_file_size: None,
            max_file_size: None,
            calculate_hashes: false, // Disable full hashing for large files
            quick_hash_threshold: 1024 * 1024,
            duplicate_strategy: DuplicateStrategy::SmartDetection,
            large_file_threshold: 100 * 1024 * 1024,
        };
        
        let files = vec![
            // Small files (should use name+size)
            FileInfo {
                path: "/test/small1.txt".to_string(),
                name: "small.txt".to_string(),
                size: 512 * 1024, // 512KB
                modified: chrono::Utc::now(),
                created: chrono::Utc::now(),
                is_directory: false,
                extension: Some("txt".to_string()),
                hash: None,
            },
            FileInfo {
                path: "/test/small2.txt".to_string(),
                name: "small.txt".to_string(),
                size: 512 * 1024, // 512KB
                modified: chrono::Utc::now(),
                created: chrono::Utc::now(),
                is_directory: false,
                extension: Some("txt".to_string()),
                hash: None,
            },
            // Large files (should use name+size since hashing disabled)
            FileInfo {
                path: "/test/large1.bin".to_string(),
                name: "large.bin".to_string(),
                size: 200 * 1024 * 1024, // 200MB
                modified: chrono::Utc::now(),
                created: chrono::Utc::now(),
                is_directory: false,
                extension: Some("bin".to_string()),
                hash: None,
            },
            FileInfo {
                path: "/test/large2.bin".to_string(),
                name: "large.bin".to_string(),
                size: 200 * 1024 * 1024, // 200MB
                modified: chrono::Utc::now(),
                created: chrono::Utc::now(),
                is_directory: false,
                extension: Some("bin".to_string()),
                hash: None,
            },
        ];
        
        let duplicates = analyzer.find_duplicates_smart(&files, &config).await.expect("Failed to detect duplicates");
        
        // Should find 2 duplicate groups
        assert_eq!(duplicates.len(), 2);
        
        // Each group should have 2 files
        for group in &duplicates {
            assert_eq!(group.files.len(), 2);
        }
    }

    #[tokio::test] 
    async fn test_partial_hash_calculation() {
        // Create a temporary test file
        let temp_dir = TempDir::new().expect("Failed to create temp dir");
        let test_file = temp_dir.path().join("test_file.txt");
        
        // Write test content (more than 128KB to test both start and end hashing)
        let content = "A".repeat(200 * 1024); // 200KB of 'A's
        fs::write(&test_file, &content).expect("Failed to write test file");
        
        let websocket_manager = Arc::new(WebSocketManager::new());
        let analyzer = DiskAnalyzer::new(websocket_manager);
        
        // Calculate partial hash
        let hash = analyzer.calculate_partial_hash(test_file.to_str().unwrap()).await;
        
        // Should succeed and return a valid hash
        assert!(hash.is_ok());
        let hash_value = hash.unwrap();
        assert_eq!(hash_value.len(), 64); // SHA-256 hex string length
        assert!(hash_value.chars().all(|c| c.is_ascii_hexdigit()));
    }
}