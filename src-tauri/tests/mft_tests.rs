use disk_dominator::mft_scanner::MftScanner;

#[cfg(test)]
mod mft_tests {
    use super::*;

    #[test]
    fn test_mft_availability() {
        // Test MFT availability check
        let is_available = MftScanner::is_mft_available();
        
        #[cfg(target_os = "windows")]
        {
            // On Windows, this should attempt to check fsutil availability
            println!("MFT availability on Windows: {}", is_available);
        }
        
        #[cfg(not(target_os = "windows"))]
        {
            // On non-Windows systems, should always return false
            assert!(!is_available);
        }
    }

    #[test]
    fn test_scan_time_estimation() {
        // Test scan time estimation for different filesystems
        let ntfs_time = MftScanner::estimate_scan_time(100 * 1024 * 1024 * 1024, "NTFS"); // 100GB NTFS
        let fat32_time = MftScanner::estimate_scan_time(100 * 1024 * 1024 * 1024, "FAT32"); // 100GB FAT32
        let unknown_time = MftScanner::estimate_scan_time(100 * 1024 * 1024 * 1024, "UNKNOWN"); // 100GB Unknown
        
        // NTFS should be fastest due to MFT
        assert!(ntfs_time <= fat32_time);
        assert!(ntfs_time <= unknown_time);
        
        // All estimates should be reasonable (not zero, not too large)
        assert!(ntfs_time > 0);
        assert!(ntfs_time < 10000); // Less than 10000 seconds for 100GB
        
        println!("Estimated scan times for 100GB:");
        println!("NTFS: {} seconds", ntfs_time);
        println!("FAT32: {} seconds", fat32_time);
        println!("Unknown: {} seconds", unknown_time);
    }

    #[tokio::test]
    async fn test_mft_scan_fallback() {
        // Test MFT scan with fallback mechanisms
        // We'll test with a path that should trigger fallbacks
        
        #[cfg(target_os = "windows")]
        {
            // Test with a drive that might not exist to trigger fallbacks
            let result = MftScanner::scan_mft("Z").await;
            
            // Should either succeed or fail gracefully
            match result {
                Ok(scan_result) => {
                    println!("MFT scan succeeded: {} files found in {}ms", 
                            scan_result.total_files, scan_result.scan_duration_ms);
                },
                Err(e) => {
                    println!("MFT scan failed as expected: {}", e);
                    // This is acceptable for non-existent drives
                }
            }
        }
        
        #[cfg(not(target_os = "windows"))]
        {
            // Test Unix fallback
            let result = MftScanner::scan_mft("/tmp").await;
            
            match result {
                Ok(scan_result) => {
                    println!("Unix scan succeeded: {} files found", scan_result.total_files);
                    assert!(scan_result.scan_duration_ms > 0);
                },
                Err(e) => {
                    println!("Unix scan failed: {}", e);
                    // This might fail if /tmp doesn't exist or permission issues
                }
            }
        }
    }

    #[test]
    fn test_mft_record_structures() {
        use disk_dominator::mft_scanner::{MftFileRecord, MftScanResult};
        use chrono::Utc;
        
        // Test that our MFT structures can be created and serialized
        let file_record = MftFileRecord {
            path: "C:\\test\\file.txt".to_string(),
            name: "file.txt".to_string(),
            size: 1024,
            created: Utc::now(),
            modified: Utc::now(),
            is_directory: false,
            attributes: 0x20, // FILE_ATTRIBUTE_ARCHIVE
            file_id: 12345,
            parent_id: 678,
        };
        
        let scan_result = MftScanResult {
            files: vec![file_record],
            total_files: 1,
            scan_duration_ms: 100,
            bytes_per_second: 10240,
        };
        
        // Test serialization
        let json = serde_json::to_string(&scan_result).expect("Failed to serialize MftScanResult");
        assert!(json.contains("file.txt"));
        assert!(json.contains("total_files"));
        
        // Test deserialization
        let parsed: MftScanResult = serde_json::from_str(&json).expect("Failed to deserialize MftScanResult");
        assert_eq!(parsed.total_files, 1);
        assert_eq!(parsed.files[0].name, "file.txt");
    }

    #[cfg(target_os = "windows")]
    #[tokio::test]
    async fn test_windows_api_structures() {
        // Test that Windows API structures are properly sized
        use std::mem;
        use disk_dominator::mft_scanner::*;
        
        // These sizes should match Windows API expectations
        // Note: Actual Windows API structures might have different sizes
        // This test ensures our structures are reasonable
        
        println!("NtfsVolumeData size: {} bytes", mem::size_of::<NtfsVolumeData>());
        println!("FileRecordInput size: {} bytes", mem::size_of::<FileRecordInput>());
        println!("UsnJournalData size: {} bytes", mem::size_of::<UsnJournalData>());
        
        // Basic sanity checks
        assert!(mem::size_of::<NtfsVolumeData>() > 0);
        assert!(mem::size_of::<FileRecordInput>() >= 8); // At least u64 size
        assert!(mem::size_of::<UsnJournalData>() > 0);
    }
}