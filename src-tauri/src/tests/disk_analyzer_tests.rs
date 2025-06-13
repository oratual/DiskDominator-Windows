#[cfg(test)]
mod tests {
    use crate::disk_analyzer::*;
    use tempfile::TempDir;
    use std::fs;
    use std::io::Write;

    #[tokio::test]
    async fn test_disk_analyzer_scan() {
        // Create temporary directory with test files
        let temp_dir = TempDir::new().unwrap();
        let temp_path = temp_dir.path();
        
        // Create test file structure
        fs::create_dir_all(temp_path.join("subdir")).unwrap();
        
        let mut file1 = fs::File::create(temp_path.join("test1.txt")).unwrap();
        file1.write_all(b"Hello, world!").unwrap();
        
        let mut file2 = fs::File::create(temp_path.join("subdir/test2.txt")).unwrap();
        file2.write_all(b"Test content").unwrap();
        
        // Create analyzer and scan
        let analyzer = DiskAnalyzer::new();
        let options = ScanOptions {
            scan_type: ScanType::Quick,
            exclude_patterns: vec![],
        };
        
        let result = analyzer.scan_directory(
            temp_path.to_str().unwrap(),
            &options
        ).await;
        
        assert!(result.is_ok());
        let files = result.unwrap();
        assert_eq!(files.len(), 2);
        
        // Verify file properties
        let file1_info = files.iter().find(|f| f.name == "test1.txt").unwrap();
        assert_eq!(file1_info.size, 13); // "Hello, world!" is 13 bytes
        assert!(!file1_info.is_directory);
    }

    #[tokio::test]
    async fn test_duplicate_detection() {
        let temp_dir = TempDir::new().unwrap();
        let temp_path = temp_dir.path();
        
        // Create duplicate files
        let content = b"Duplicate content";
        fs::write(temp_path.join("file1.txt"), content).unwrap();
        fs::write(temp_path.join("file2.txt"), content).unwrap();
        fs::write(temp_path.join("unique.txt"), b"Unique content").unwrap();
        
        let analyzer = DiskAnalyzer::new();
        let options = ScanOptions {
            scan_type: ScanType::Deep,
            exclude_patterns: vec![],
        };
        
        let files = analyzer.scan_directory(
            temp_path.to_str().unwrap(),
            &options
        ).await.unwrap();
        
        let duplicates = analyzer.find_duplicates(files).await.unwrap();
        
        // Should find one duplicate group with 2 files
        assert_eq!(duplicates.len(), 1);
        assert_eq!(duplicates[0].files.len(), 2);
        assert_eq!(duplicates[0].potential_savings, content.len() as u64);
    }

    #[tokio::test]
    async fn test_exclude_patterns() {
        let temp_dir = TempDir::new().unwrap();
        let temp_path = temp_dir.path();
        
        // Create files
        fs::write(temp_path.join("include.txt"), b"Include").unwrap();
        fs::write(temp_path.join("exclude.tmp"), b"Exclude").unwrap();
        fs::write(temp_path.join("test.log"), b"Log").unwrap();
        
        let analyzer = DiskAnalyzer::new();
        let options = ScanOptions {
            scan_type: ScanType::Quick,
            exclude_patterns: vec!["*.tmp".to_string(), "*.log".to_string()],
        };
        
        let files = analyzer.scan_directory(
            temp_path.to_str().unwrap(),
            &options
        ).await.unwrap();
        
        // Should only find the .txt file
        assert_eq!(files.len(), 1);
        assert_eq!(files[0].name, "include.txt");
    }

    #[tokio::test]
    async fn test_scan_progress() {
        let analyzer = DiskAnalyzer::new();
        
        // Get initial progress
        let progress = analyzer.get_progress().await;
        assert_eq!(progress.total_files, 0);
        assert_eq!(progress.processed_files, 0);
        
        // Progress should update during scan
        // This would require a larger test directory to properly test
    }

    #[test]
    fn test_scan_type_serialization() {
        use serde_json;
        
        let quick = ScanType::Quick;
        let json = serde_json::to_string(&quick).unwrap();
        assert_eq!(json, r#""Quick""#);
        
        let deep = ScanType::Deep;
        let json = serde_json::to_string(&deep).unwrap();
        assert_eq!(json, r#""Deep""#);
    }
}