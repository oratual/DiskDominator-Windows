use serde::{Deserialize, Serialize};
use anyhow::Result;
use std::process::Command;
use std::path::Path;
use chrono::{DateTime, Utc};

#[cfg(target_os = "windows")]
use winapi::{
    shared::minwindef::{DWORD, LPVOID},
    shared::ntdef::HANDLE,
    um::{
        fileapi::{CreateFileW, ReadFile, GetFileSize, OPEN_EXISTING},
        handleapi::{CloseHandle, INVALID_HANDLE_VALUE},
        ioapiset::DeviceIoControl,
        winbase::FILE_FLAG_BACKUP_SEMANTICS,
        winnt::{GENERIC_READ, FILE_SHARE_READ, FILE_SHARE_WRITE},
    },
};

// Windows API constants for MFT access
#[cfg(target_os = "windows")]
const FSCTL_GET_NTFS_VOLUME_DATA: DWORD = 0x90064;
#[cfg(target_os = "windows")]
const FSCTL_GET_NTFS_FILE_RECORD: DWORD = 0x90068;
#[cfg(target_os = "windows")]
const FSCTL_ENUM_USN_DATA: DWORD = 0x900b3;

#[cfg(target_os = "windows")]
#[repr(C)]
struct NtfsVolumeData {
    volume_serial_number: u64,
    number_sectors: u64,
    total_clusters: u64,
    free_clusters: u64,
    total_reserved: u64,
    bytes_per_sector: u32,
    bytes_per_cluster: u32,
    bytes_per_file_record_segment: u32,
    clusters_per_file_record_segment: u32,
    mft_valid_data_length: u64,
    mft_start_lcn: u64,
    mft2_start_lcn: u64,
    mft_zone_start: u64,
    mft_zone_end: u64,
}

#[cfg(target_os = "windows")]
#[repr(C)]
struct FileRecordInput {
    file_reference_number: u64,
}

#[cfg(target_os = "windows")]
#[repr(C)]
struct UsnJournalData {
    usn_journal_id: u64,
    first_usn: i64,
    next_usn: i64,
    lowest_valid_usn: i64,
    max_usn: i64,
    maximum_size: u64,
    allocation_delta: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MftFileRecord {
    pub path: String,
    pub name: String,
    pub size: u64,
    pub created: DateTime<Utc>,
    pub modified: DateTime<Utc>,
    pub is_directory: bool,
    pub attributes: u32,
    pub file_id: u64,
    pub parent_id: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MftScanResult {
    pub files: Vec<MftFileRecord>,
    pub total_files: u64,
    pub scan_duration_ms: u64,
    pub bytes_per_second: u64,
}

pub struct MftScanner;

impl MftScanner {
    /// Perform MFT-based quick scan (Windows only)
    #[cfg(target_os = "windows")]
    pub async fn scan_mft(drive_letter: &str) -> Result<MftScanResult> {
        use std::time::Instant;
        
        let start_time = Instant::now();
        let mut files = Vec::new();
        
        // Method 1: Try using fsutil to enumerate files via MFT
        if let Ok(mft_files) = Self::scan_via_fsutil(drive_letter).await {
            files.extend(mft_files);
        }
        
        // Method 2: If fsutil fails, try PowerShell with Get-ChildItem optimized
        if files.is_empty() {
            if let Ok(ps_files) = Self::scan_via_powershell_mft(drive_letter).await {
                files.extend(ps_files);
            }
        }
        
        // Method 3: If all else fails, use basic enumeration
        if files.is_empty() {
            files = Self::scan_via_basic_enum(drive_letter).await?;
        }
        
        let scan_duration = start_time.elapsed();
        let total_bytes = files.iter().map(|f| f.size).sum::<u64>();
        let bytes_per_second = if scan_duration.as_secs() > 0 {
            total_bytes / scan_duration.as_secs()
        } else {
            total_bytes
        };
        
        Ok(MftScanResult {
            total_files: files.len() as u64,
            files,
            scan_duration_ms: scan_duration.as_millis() as u64,
            bytes_per_second,
        })
    }
    
    /// Unix/Linux fallback (no MFT, but still fast)
    #[cfg(not(target_os = "windows"))]
    pub async fn scan_mft(path: &str) -> Result<MftScanResult> {
        use std::time::Instant;
        
        let start_time = Instant::now();
        let files = Self::scan_via_find_command(path).await?;
        
        let scan_duration = start_time.elapsed();
        let total_bytes = files.iter().map(|f| f.size).sum::<u64>();
        let bytes_per_second = if scan_duration.as_secs() > 0 {
            total_bytes / scan_duration.as_secs()
        } else {
            total_bytes
        };
        
        Ok(MftScanResult {
            total_files: files.len() as u64,
            files,
            scan_duration_ms: scan_duration.as_millis() as u64,
            bytes_per_second,
        })
    }
    
    /// Method 1: Use DeviceIoControl for direct MFT access (Windows)
    #[cfg(target_os = "windows")]
    async fn scan_via_fsutil(drive_letter: &str) -> Result<Vec<MftFileRecord>> {
        // Try direct MFT access first
        if let Ok(mft_files) = Self::scan_via_device_io_control(drive_letter).await {
            return Ok(mft_files);
        }
        
        // Fallback to fsutil command
        let mut files = Vec::new();
        
        // Use fsutil to dump MFT information
        let output = Command::new("fsutil")
            .args(&["file", "layout", &format!("{}:\\", drive_letter)])
            .output()?;
            
        if output.status.success() {
            let output_str = String::from_utf8_lossy(&output.stdout);
            
            // Parse fsutil output (this is a simplified version)
            // In a real implementation, we'd need to parse the actual MFT structure
            for line in output_str.lines() {
                if line.contains("File ID:") {
                    // This is a simplified parser - real MFT parsing is much more complex
                    // Would need proper MFT record parsing here
                }
            }
        }
        
        // If fsutil doesn't give us what we need, fall back to dir command with optimization
        if files.is_empty() {
            files = Self::scan_via_dir_command(drive_letter).await?;
        }
        
        Ok(files)
    }
    
    /// Direct MFT access using DeviceIoControl (Windows)
    #[cfg(target_os = "windows")]
    async fn scan_via_device_io_control(drive_letter: &str) -> Result<Vec<MftFileRecord>> {
        use std::ffi::OsStr;
        use std::os::windows::ffi::OsStrExt;
        use std::ptr;
        
        let mut files = Vec::new();
        
        // Convert drive path to wide string
        let drive_path = format!("\\\\.\\{}:", drive_letter);
        let wide_path: Vec<u16> = OsStr::new(&drive_path)
            .encode_wide()
            .chain(std::iter::once(0))
            .collect();
        
        unsafe {
            // Open volume handle
            let volume_handle = CreateFileW(
                wide_path.as_ptr(),
                GENERIC_READ,
                FILE_SHARE_READ | FILE_SHARE_WRITE,
                ptr::null_mut(),
                OPEN_EXISTING,
                FILE_FLAG_BACKUP_SEMANTICS,
                ptr::null_mut(),
            );
            
            if volume_handle == INVALID_HANDLE_VALUE {
                return Err(anyhow::anyhow!("Failed to open volume handle"));
            }
            
            // Get NTFS volume data to understand MFT structure
            let mut volume_data = std::mem::zeroed::<NtfsVolumeData>();
            let mut bytes_returned: DWORD = 0;
            
            let volume_success = DeviceIoControl(
                volume_handle,
                FSCTL_GET_NTFS_VOLUME_DATA,
                ptr::null_mut(),
                0,
                &mut volume_data as *mut _ as LPVOID,
                std::mem::size_of::<NtfsVolumeData>() as DWORD,
                &mut bytes_returned,
                ptr::null_mut(),
            );
            
            if volume_success != 0 {
                tracing::info!(
                    "MFT located at LCN {}, {} bytes per record",
                    volume_data.mft_start_lcn,
                    volume_data.bytes_per_file_record_segment
                );
                
                // Calculate MFT size and iterate through records
                let mft_size = volume_data.mft_valid_data_length;
                let record_size = volume_data.bytes_per_file_record_segment as u64;
                let total_records = mft_size / record_size;
                
                // For performance, we'll limit to scanning first 100,000 records
                // In production, this would be configurable or use streaming
                let max_records = std::cmp::min(total_records, 100000);
                
                for record_number in 0..max_records {
                    if let Ok(file_record) = Self::read_mft_record(volume_handle, record_number) {
                        files.push(file_record);
                    }
                    
                    // Yield periodically for async cooperation
                    if record_number % 1000 == 0 {
                        tokio::task::yield_now().await;
                    }
                }
            }
            
            CloseHandle(volume_handle);
        }
        
        if files.is_empty() {
            return Err(anyhow::anyhow!("No files found via DeviceIoControl"));
        }
        
        Ok(files)
    }
    
    /// Read a single MFT record (Windows)
    #[cfg(target_os = "windows")]
    fn read_mft_record(volume_handle: HANDLE, record_number: u64) -> Result<MftFileRecord> {
        use std::ptr;
        
        unsafe {
            let input = FileRecordInput {
                file_reference_number: record_number,
            };
            
            // Buffer for MFT record (typically 1024 bytes)
            let mut buffer = vec![0u8; 4096];
            let mut bytes_returned: DWORD = 0;
            
            let success = DeviceIoControl(
                volume_handle,
                FSCTL_GET_NTFS_FILE_RECORD,
                &input as *const _ as LPVOID,
                std::mem::size_of::<FileRecordInput>() as DWORD,
                buffer.as_mut_ptr() as LPVOID,
                buffer.len() as DWORD,
                &mut bytes_returned,
                ptr::null_mut(),
            );
            
            if success == 0 || bytes_returned == 0 {
                return Err(anyhow::anyhow!("Failed to read MFT record"));
            }
            
            // Parse MFT record (simplified - real parsing is complex)
            // This is a basic implementation for demonstration
            Self::parse_mft_record(&buffer[..bytes_returned as usize])
        }
    }
    
    /// Parse MFT record bytes into file information (Windows)
    #[cfg(target_os = "windows")]
    fn parse_mft_record(buffer: &[u8]) -> Result<MftFileRecord> {
        // This is a simplified MFT parser
        // Real MFT parsing requires understanding the complex NTFS structure
        
        if buffer.len() < 48 {
            return Err(anyhow::anyhow!("Buffer too small for MFT record"));
        }
        
        // Check MFT signature ("FILE")
        if &buffer[0..4] != b"FILE" {
            return Err(anyhow::anyhow!("Invalid MFT record signature"));
        }
        
        // Basic MFT record parsing (simplified)
        // In reality, we'd need to parse attributes, handle compressed data, etc.
        let flags = u16::from_le_bytes([buffer[22], buffer[23]]);
        let is_directory = (flags & 0x0002) != 0;
        let is_in_use = (flags & 0x0001) != 0;
        
        if !is_in_use {
            return Err(anyhow::anyhow!("Record not in use"));
        }
        
        // Create a placeholder record (real implementation would extract all attributes)
        Ok(MftFileRecord {
            path: format!("\\Record{}", 0), // Would extract from $FILE_NAME attribute
            name: format!("file{}", 0),     // Would extract from $FILE_NAME attribute
            size: 0,                        // Would extract from $DATA attribute
            created: Utc::now(),            // Would extract from $STANDARD_INFORMATION
            modified: Utc::now(),           // Would extract from $STANDARD_INFORMATION
            is_directory,
            attributes: flags as u32,
            file_id: 0,                     // Would extract from record header
            parent_id: 0,                   // Would extract from $FILE_NAME attribute
        })
    }
    
    /// Method 2: Use PowerShell with MFT-optimized commands
    #[cfg(target_os = "windows")]
    async fn scan_via_powershell_mft(drive_letter: &str) -> Result<Vec<MftFileRecord>> {
        let mut files = Vec::new();
        
        // PowerShell script optimized for speed
        let ps_script = format!(r#"
            $drive = "{}:\"
            Get-ChildItem -Path $drive -Recurse -Force -ErrorAction SilentlyContinue | 
            Where-Object {{$_.Mode -notlike "d*"}} |
            Select-Object FullName, Name, Length, CreationTime, LastWriteTime |
            ForEach-Object {{
                "$($_.FullName)|$($_.Name)|$($_.Length)|$($_.CreationTime)|$($_.LastWriteTime)"
            }}
        "#, drive_letter);
        
        let output = Command::new("powershell")
            .args(&["-NoProfile", "-Command", &ps_script])
            .output()?;
            
        if output.status.success() {
            let output_str = String::from_utf8_lossy(&output.stdout);
            
            for line in output_str.lines() {
                if line.trim().is_empty() {
                    continue;
                }
                
                let parts: Vec<&str> = line.split('|').collect();
                if parts.len() >= 5 {
                    let size = parts[2].parse::<u64>().unwrap_or(0);
                    
                    // Parse dates (simplified)
                    let created = chrono::Utc::now(); // Placeholder
                    let modified = chrono::Utc::now(); // Placeholder
                    
                    files.push(MftFileRecord {
                        path: parts[0].to_string(),
                        name: parts[1].to_string(),
                        size,
                        created,
                        modified,
                        is_directory: false,
                        attributes: 0,
                        file_id: 0,
                        parent_id: 0,
                    });
                }
            }
        }
        
        Ok(files)
    }
    
    /// Method 3: Use dir command (Windows fallback)
    #[cfg(target_os = "windows")]
    async fn scan_via_dir_command(drive_letter: &str) -> Result<Vec<MftFileRecord>> {
        let mut files = Vec::new();
        
        // Use dir with /s for recursive and /a for all files
        let output = Command::new("cmd")
            .args(&["/c", &format!("dir {}:\\ /s /a-d /b", drive_letter)])
            .output()?;
            
        if output.status.success() {
            let output_str = String::from_utf8_lossy(&output.stdout);
            
            for line in output_str.lines() {
                if line.trim().is_empty() {
                    continue;
                }
                
                let path = line.trim();
                if let Ok(metadata) = std::fs::metadata(path) {
                    let file_name = Path::new(path)
                        .file_name()
                        .and_then(|n| n.to_str())
                        .unwrap_or("")
                        .to_string();
                    
                    files.push(MftFileRecord {
                        path: path.to_string(),
                        name: file_name,
                        size: metadata.len(),
                        created: metadata.created().unwrap_or(std::time::SystemTime::now()).into(),
                        modified: metadata.modified().unwrap_or(std::time::SystemTime::now()).into(),
                        is_directory: false,
                        attributes: 0,
                        file_id: 0,
                        parent_id: 0,
                    });
                }
            }
        }
        
        Ok(files)
    }
    
    /// Unix/Linux method using find command
    #[cfg(not(target_os = "windows"))]
    async fn scan_via_find_command(path: &str) -> Result<Vec<MftFileRecord>> {
        let mut files = Vec::new();
        
        // Use find command for fast filesystem traversal
        let output = Command::new("find")
            .args(&[path, "-type", "f", "-printf", "%p|%s|%T@|%C@\n"])
            .output()?;
            
        if output.status.success() {
            let output_str = String::from_utf8_lossy(&output.stdout);
            
            for line in output_str.lines() {
                if line.trim().is_empty() {
                    continue;
                }
                
                let parts: Vec<&str> = line.split('|').collect();
                if parts.len() >= 4 {
                    let path = parts[0];
                    let size = parts[1].parse::<u64>().unwrap_or(0);
                    
                    let file_name = Path::new(path)
                        .file_name()
                        .and_then(|n| n.to_str())
                        .unwrap_or("")
                        .to_string();
                    
                    // Convert Unix timestamps
                    let modified_timestamp = parts[2].parse::<f64>().unwrap_or(0.0) as i64;
                    let created_timestamp = parts[3].parse::<f64>().unwrap_or(0.0) as i64;
                    
                    let modified = DateTime::from_timestamp(modified_timestamp, 0)
                        .unwrap_or_else(|| Utc::now());
                    let created = DateTime::from_timestamp(created_timestamp, 0)
                        .unwrap_or_else(|| Utc::now());
                    
                    files.push(MftFileRecord {
                        path: path.to_string(),
                        name: file_name,
                        size,
                        created,
                        modified,
                        is_directory: false,
                        attributes: 0,
                        file_id: 0,
                        parent_id: 0,
                    });
                }
            }
        }
        
        Ok(files)
    }
    
    /// Basic fallback method
    async fn scan_via_basic_enum(path: &str) -> Result<Vec<MftFileRecord>> {
        use std::fs;
        use walkdir::WalkDir;
        
        let mut files = Vec::new();
        
        for entry in WalkDir::new(path).into_iter().filter_map(|e| e.ok()) {
            if entry.file_type().is_file() {
                let metadata = entry.metadata()?;
                let file_name = entry.file_name().to_string_lossy().to_string();
                
                files.push(MftFileRecord {
                    path: entry.path().to_string_lossy().to_string(),
                    name: file_name,
                    size: metadata.len(),
                    created: metadata.created().unwrap_or(std::time::SystemTime::now()).into(),
                    modified: metadata.modified().unwrap_or(std::time::SystemTime::now()).into(),
                    is_directory: false,
                    attributes: 0,
                    file_id: 0,
                    parent_id: 0,
                });
            }
        }
        
        Ok(files)
    }
    
    /// Estimate scan time based on drive characteristics
    pub fn estimate_scan_time(total_space: u64, filesystem: &str) -> u64 {
        // Rough estimates based on filesystem and size
        let base_time = match filesystem.to_uppercase().as_str() {
            "NTFS" => 30,    // NTFS is fastest due to MFT
            "FAT32" => 120,  // FAT32 is slower
            "EXFAT" => 60,   // exFAT is medium
            _ => 90,         // Unknown filesystem
        };
        
        // Scale based on size (1GB per second base rate)
        let size_factor = (total_space / (1024 * 1024 * 1024)).max(1); // GB
        base_time + (size_factor * 2) // 2 seconds per GB
    }
    
    /// Check if MFT scanning is available
    #[cfg(target_os = "windows")]
    pub fn is_mft_available() -> bool {
        // Check if we have necessary permissions and tools
        Command::new("fsutil")
            .args(&["/?"])
            .output()
            .map(|output| output.status.success())
            .unwrap_or(false)
    }
    
    #[cfg(not(target_os = "windows"))]
    pub fn is_mft_available() -> bool {
        false // MFT is Windows-only
    }
}