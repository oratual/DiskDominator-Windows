use serde::{Deserialize, Serialize};
use anyhow::Result;
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use tokio::sync::{mpsc, Mutex, RwLock};
use tokio::fs;
use tokio::io::{AsyncReadExt, BufReader};
use sha2::{Sha256, Digest};
use std::time::{Duration, Instant};
use uuid::Uuid;
use crate::file_system::FileInfo;
use crate::commands::file_commands::ScanOptions;
use crate::websocket::{WebSocketManager, ScanProgressMessage};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ScanType {
    Quick,
    Deep,
    Custom,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DuplicateStrategy {
    HashOnly,        // SHA-256 hash comparison (most accurate, slowest)
    NameAndSize,     // Name + size comparison (fast, less accurate)
    NameSizePartialHash, // Name + size + partial hash (balanced)
    SmartDetection,  // Adaptive based on file size and type
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanConfig {
    pub exclude_patterns: Vec<String>,
    pub include_hidden: bool,
    pub follow_symlinks: bool,
    pub max_depth: Option<usize>,
    pub min_file_size: Option<u64>,
    pub max_file_size: Option<u64>,
    pub calculate_hashes: bool,
    pub quick_hash_threshold: u64, // Only calculate partial hash for files above this size
    pub duplicate_strategy: DuplicateStrategy,
    pub large_file_threshold: u64, // Files above this size are considered "large"
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DualScanProgress {
    pub quick_scan: ScanProgress,
    pub deep_scan: ScanProgress,
    pub overall_progress: f64,
    pub current_phase: String, // "quick", "deep", "completed"
    pub estimated_total_time: u64,
    pub elapsed_time: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanSession {
    pub id: String,
    pub disk_path: String,
    pub scan_type: ScanType,
    pub config: ScanConfig,
    pub status: ScanSessionStatus,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub started_at: Option<chrono::DateTime<chrono::Utc>>,
    pub paused_at: Option<chrono::DateTime<chrono::Utc>>,
    pub completed_at: Option<chrono::DateTime<chrono::Utc>>,
    pub progress: DualScanProgress,
    pub results: Option<ScanResults>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ScanSessionStatus {
    Created,
    Running,
    Paused,
    Completed,
    Error(String),
    Cancelled,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanResults {
    pub files: Vec<FileInfo>,
    pub duplicate_groups: Vec<DuplicateGroup>,
    pub large_files: Vec<FileInfo>,
    pub total_files: u64,
    pub total_size: u64,
    pub scan_duration: u64,
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

#[derive(Clone)]
pub struct DiskAnalyzer {
    progress: Arc<Mutex<ScanProgress>>,
    websocket_manager: Arc<WebSocketManager>,
    active_sessions: Arc<RwLock<HashMap<String, ScanSession>>>,
    is_paused: Arc<AtomicBool>,
    should_cancel: Arc<AtomicBool>,
    files_processed: Arc<AtomicU64>,
    bytes_processed: Arc<AtomicU64>,
    scan_start_time: Arc<Mutex<Option<Instant>>>,
}

impl DiskAnalyzer {
    pub fn new(websocket_manager: Arc<WebSocketManager>) -> Self {
        Self {
            progress: Arc::new(Mutex::new(ScanProgress {
                total_files: 0,
                processed_files: 0,
                total_size: 0,
                current_path: String::new(),
                errors: Vec::new(),
            })),
            websocket_manager,
            active_sessions: Arc::new(RwLock::new(HashMap::new())),
            is_paused: Arc::new(AtomicBool::new(false)),
            should_cancel: Arc::new(AtomicBool::new(false)),
            files_processed: Arc::new(AtomicU64::new(0)),
            bytes_processed: Arc::new(AtomicU64::new(0)),
            scan_start_time: Arc::new(Mutex::new(None)),
        }
    }

    /// Create a new scan session
    pub async fn create_scan_session(
        &self,
        disk_path: String,
        scan_type: ScanType,
        config: ScanConfig,
    ) -> Result<String> {
        let session_id = Uuid::new_v4().to_string();
        let session = ScanSession {
            id: session_id.clone(),
            disk_path: disk_path.clone(),
            scan_type: scan_type.clone(),
            config,
            status: ScanSessionStatus::Created,
            created_at: chrono::Utc::now(),
            started_at: None,
            paused_at: None,
            completed_at: None,
            progress: DualScanProgress {
                quick_scan: ScanProgress {
                    total_files: 0,
                    processed_files: 0,
                    total_size: 0,
                    current_path: String::new(),
                    errors: Vec::new(),
                },
                deep_scan: ScanProgress {
                    total_files: 0,
                    processed_files: 0,
                    total_size: 0,
                    current_path: String::new(),
                    errors: Vec::new(),
                },
                overall_progress: 0.0,
                current_phase: "created".to_string(),
                estimated_total_time: 0,
                elapsed_time: 0,
            },
            results: None,
        };

        {
            let mut sessions = self.active_sessions.write().await;
            sessions.insert(session_id.clone(), session);
        }

        // Start WebSocket session
        let scan_type_str = match scan_type {
            ScanType::Quick => "quick",
            ScanType::Deep => "deep",
            ScanType::Custom => "custom",
        };
        
        self.websocket_manager.start_scan_session(disk_path, scan_type_str.to_string()).await?;

        Ok(session_id)
    }

    /// Start a scan session
    pub async fn start_scan_session(&self, session_id: &str) -> Result<()> {
        let session = {
            let mut sessions = self.active_sessions.write().await;
            let session = sessions.get_mut(session_id)
                .ok_or_else(|| anyhow::anyhow!("Session not found"))?;
            
            session.status = ScanSessionStatus::Running;
            session.started_at = Some(chrono::Utc::now());
            session.clone()
        };

        // Reset atomic counters
        self.is_paused.store(false, Ordering::SeqCst);
        self.should_cancel.store(false, Ordering::SeqCst);
        self.files_processed.store(0, Ordering::SeqCst);
        self.bytes_processed.store(0, Ordering::SeqCst);
        
        {
            let mut start_time = self.scan_start_time.lock().await;
            *start_time = Some(Instant::now());
        }

        // Start the dual scanning process
        self.perform_dual_scan(session_id, &session).await?;

        Ok(())
    }

    /// Pause a scan session
    pub async fn pause_scan_session(&self, session_id: &str) -> Result<()> {
        self.is_paused.store(true, Ordering::SeqCst);
        
        {
            let mut sessions = self.active_sessions.write().await;
            if let Some(session) = sessions.get_mut(session_id) {
                session.status = ScanSessionStatus::Paused;
                session.paused_at = Some(chrono::Utc::now());
            }
        }

        self.websocket_manager.pause_scan_session(session_id).await?;
        Ok(())
    }

    /// Resume a scan session
    pub async fn resume_scan_session(&self, session_id: &str) -> Result<()> {
        self.is_paused.store(false, Ordering::SeqCst);
        
        {
            let mut sessions = self.active_sessions.write().await;
            if let Some(session) = sessions.get_mut(session_id) {
                session.status = ScanSessionStatus::Running;
                session.paused_at = None;
            }
        }

        self.websocket_manager.resume_scan_session(session_id).await?;
        Ok(())
    }

    /// Cancel a scan session
    pub async fn cancel_scan_session(&self, session_id: &str) -> Result<()> {
        self.should_cancel.store(true, Ordering::SeqCst);
        
        {
            let mut sessions = self.active_sessions.write().await;
            if let Some(session) = sessions.get_mut(session_id) {
                session.status = ScanSessionStatus::Cancelled;
            }
        }

        Ok(())
    }

    /// Get a scan session
    pub async fn get_scan_session(&self, session_id: &str) -> Option<ScanSession> {
        let sessions = self.active_sessions.read().await;
        sessions.get(session_id).cloned()
    }

    /// Get all active sessions
    pub async fn get_active_sessions(&self) -> HashMap<String, ScanSession> {
        self.active_sessions.read().await.clone()
    }

    /// Perform dual scanning (quick then deep)
    async fn perform_dual_scan(&self, session_id: &str, session: &ScanSession) -> Result<()> {
        let mut results = ScanResults {
            files: Vec::new(),
            duplicate_groups: Vec::new(),
            large_files: Vec::new(),
            total_files: 0,
            total_size: 0,
            scan_duration: 0,
        };

        let start_time = Instant::now();

        // Phase 1: Quick scan (metadata only)
        self.update_session_phase(session_id, "quick").await?;
        let quick_files = self.perform_quick_scan(session_id, &session.disk_path, &session.config).await?;
        
        if self.should_cancel.load(Ordering::SeqCst) {
            return Ok(());
        }

        results.files = quick_files;
        results.total_files = results.files.len() as u64;
        results.total_size = results.files.iter().map(|f| f.size).sum();

        // Phase 2: Deep scan (if requested)
        if matches!(session.scan_type, ScanType::Deep | ScanType::Custom) {
            self.update_session_phase(session_id, "deep").await?;
            self.perform_deep_scan(session_id, &mut results, &session.config).await?;
        }

        if self.should_cancel.load(Ordering::SeqCst) {
            return Ok(());
        }

        // Complete the session
        results.scan_duration = start_time.elapsed().as_secs();
        self.complete_scan_session(session_id, results).await?;

        Ok(())
    }
    
    pub async fn get_progress(&self) -> ScanProgress {
        self.progress.lock().await.clone()
    }
    
    /// Perform quick scan (metadata only) - MFT optimized for Windows
    async fn perform_quick_scan(
        &self,
        session_id: &str,
        path: &str,
        config: &ScanConfig,
    ) -> Result<Vec<FileInfo>> {
        // Try MFT scan first on Windows for maximum speed
        #[cfg(target_os = "windows")]
        {
            if crate::mft_scanner::MftScanner::is_mft_available() {
                if let Ok(drive_letter) = Self::extract_drive_letter(path) {
                    if let Ok(mft_result) = crate::mft_scanner::MftScanner::scan_mft(&drive_letter).await {
                        tracing::info!(
                            "MFT scan completed: {} files in {}ms", 
                            mft_result.total_files, 
                            mft_result.scan_duration_ms
                        );
                        
                        // Convert MFT results to FileInfo
                        let files = mft_result.files.into_iter()
                            .filter(|f| !Self::should_exclude_file(&f.path, config))
                            .map(|mft_file| FileInfo {
                                path: mft_file.path,
                                name: mft_file.name,
                                size: mft_file.size,
                                modified: mft_file.modified,
                                created: mft_file.created,
                                is_directory: mft_file.is_directory,
                                extension: std::path::Path::new(&mft_file.path)
                                    .extension()
                                    .and_then(|ext| ext.to_str())
                                    .map(|s| s.to_string()),
                                hash: None,
                            })
                            .collect::<Vec<_>>();
                        
                        // Send progress updates
                        self.send_mft_progress_updates(session_id, &files).await;
                        
                        return Ok(files);
                    }
                }
            }
        }
        
        // Fallback to regular scanning
        let path = PathBuf::from(path);
        let (tx, mut rx) = mpsc::channel::<FileInfo>(1000);
        let progress = self.progress.clone();
        let config = config.clone();
        let session_id = session_id.to_string();
        let websocket_manager = self.websocket_manager.clone();
        let is_paused = self.is_paused.clone();
        let should_cancel = self.should_cancel.clone();
        
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
            Self::scan_recursive_quick(
                path,
                tx,
                progress,
                &config,
                session_id,
                websocket_manager,
                is_paused,
                should_cancel,
            ).await
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

    /// Perform deep scan (content analysis and hashing) - Parallel optimized
    async fn perform_deep_scan(
        &self,
        session_id: &str,
        results: &mut ScanResults,
        config: &ScanConfig,
    ) -> Result<()> {
        if results.files.is_empty() {
            return Ok(());
        }

        let total_files = results.files.len();
        
        // Filter files for hashing (only files above threshold)
        let files_to_hash: Vec<_> = results.files.iter()
            .enumerate()
            .filter(|(_, file)| file.size > 1024 * 1024) // 1MB threshold
            .collect();
        
        let total_hash_files = files_to_hash.len();
        
        if total_hash_files == 0 {
            return Ok(());
        }

        // Use parallel processing for hash calculation
        let (hash_tx, mut hash_rx) = tokio::sync::mpsc::channel::<(usize, String, String)>(100);
        
        // Spawn parallel hash calculation task
        let files_for_hashing = files_to_hash.iter()
            .map(|(idx, file)| (*idx, file.path.clone(), file.size))
            .collect::<Vec<_>>();
        
        let hash_tx_clone = hash_tx.clone();
        let is_paused = self.is_paused.clone();
        let should_cancel = self.should_cancel.clone();
        
        tokio::spawn(async move {
            use rayon::prelude::*;
            
            // Use Rayon for parallel hash computation
            files_for_hashing.par_iter().for_each(|(idx, path, size)| {
                // Check for pause/cancel in parallel threads
                while is_paused.load(Ordering::SeqCst) {
                    std::thread::sleep(std::time::Duration::from_millis(100));
                }
                
                if should_cancel.load(Ordering::SeqCst) {
                    return;
                }
                
                // Calculate hash
                if let Ok(hash) = Self::calculate_file_hash_sync(path) {
                    let _ = hash_tx_clone.try_send((*idx, path.clone(), hash));
                }
            });
        });
        
        drop(hash_tx); // Close sender to signal completion
        
        // Collect hash results
        let mut hash_groups: HashMap<String, Vec<FileInfo>> = HashMap::new();
        let mut processed = 0;
        
        while let Some((file_idx, _path, hash)) = hash_rx.recv().await {
            if let Some(file) = results.files.get_mut(file_idx) {
                file.hash = Some(hash.clone());
                hash_groups.entry(hash).or_insert_with(Vec::new).push(file.clone());
            }
            
            processed += 1;
            let progress_percent = (processed as f64 / total_hash_files as f64) * 100.0;
            
            // Update progress every 10 files to avoid spam
            if processed % 10 == 0 || processed == total_hash_files {
                let _ = self.websocket_manager.update_scan_progress(
                    session_id,
                    ScanProgressMessage {
                        scan_id: session_id.to_string(),
                        disk_id: "deep_scan".to_string(),
                        scan_type: "deep".to_string(),
                        progress: progress_percent,
                        quick_scan_progress: Some(100.0),
                        deep_scan_progress: Some(progress_percent),
                        remaining_time: self.estimate_remaining_time(processed, total_hash_files).await,
                        files_scanned: processed as u64,
                        total_files: total_hash_files as u64,
                        bytes_scanned: self.bytes_processed.load(Ordering::SeqCst),
                        total_bytes: results.total_size,
                        current_path: results.files.get(file_idx)
                            .map(|f| f.path.clone())
                            .unwrap_or_default(),
                        scan_status: "running".to_string(),
                        errors: Vec::new(),
                    },
                ).await;
            }
        }

        // Find duplicates using the configured strategy
        let duplicate_groups = self.find_duplicates_by_strategy(&results.files, config).await?;
        results.duplicate_groups = duplicate_groups;

        // Sort duplicate groups by potential savings
        results.duplicate_groups.sort_by(|a, b| b.potential_savings.cmp(&a.potential_savings));

        // Analyze large files with advanced filtering
        results.large_files = self.analyze_large_files(&results.files, config).await;

        Ok(())
    }

    /// Scan directory and return file information with real-time progress (backward compatibility)
    pub async fn scan_directory(
        &self,
        path: &str,
        options: &ScanOptions,
    ) -> Result<Vec<FileInfo>> {
        // Convert old ScanOptions to new ScanConfig
        let config = ScanConfig {
            exclude_patterns: options.exclude_patterns.clone(),
            include_hidden: false,
            follow_symlinks: false,
            max_depth: None,
            min_file_size: None,
            max_file_size: None,
            calculate_hashes: false,
            quick_hash_threshold: 1024 * 1024, // 1MB
            duplicate_strategy: DuplicateStrategy::NameAndSize,
            large_file_threshold: 100 * 1024 * 1024, // 100MB
        };

        // Create a temporary session for backward compatibility
        let session_id = self.create_scan_session(
            path.to_string(),
            ScanType::Quick,
            config,
        ).await?;

        self.start_scan_session(&session_id).await?;
        
        // Wait for completion and return results
        loop {
            tokio::time::sleep(Duration::from_millis(100)).await;
            if let Some(session) = self.get_scan_session(&session_id).await {
                match session.status {
                    ScanSessionStatus::Completed => {
                        return Ok(session.results.map(|r| r.files).unwrap_or_default());
                    }
                    ScanSessionStatus::Error(e) => {
                        return Err(anyhow::anyhow!(e));
                    }
                    _ => continue,
                }
            }
        }
    }
    
    async fn scan_recursive_quick(
        path: PathBuf,
        tx: mpsc::Sender<FileInfo>,
        progress: Arc<Mutex<ScanProgress>>,
        config: &ScanConfig,
        session_id: String,
        websocket_manager: Arc<WebSocketManager>,
        is_paused: Arc<AtomicBool>,
        should_cancel: Arc<AtomicBool>,
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
            
            // Check for pause/cancel
            while is_paused.load(Ordering::SeqCst) {
                tokio::time::sleep(Duration::from_millis(100)).await;
            }
            
            if should_cancel.load(Ordering::SeqCst) {
                return Ok(());
            }

            // Check excluded patterns
            let path_str = path.to_string_lossy();
            if config.exclude_patterns.iter().any(|p| path_str.contains(p)) {
                continue;
            }
            
            // Check if hidden files should be included
            if !config.include_hidden && path.file_name()
                .and_then(|n| n.to_str())
                .map(|n| n.starts_with('.'))
                .unwrap_or(false) {
                continue;
            }
            
            if metadata.is_dir() {
                // Recursively scan subdirectory
                if let Err(e) = Box::pin(Self::scan_recursive_quick(
                    path.clone(),
                    tx.clone(),
                    progress.clone(),
                    config,
                    session_id.clone(),
                    websocket_manager.clone(),
                    is_paused.clone(),
                    should_cancel.clone(),
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
                let (processed, total, current_size) = {
                    let mut prog = progress.lock().await;
                    prog.total_files += 1;
                    prog.processed_files += 1;
                    prog.total_size += metadata.len();
                    prog.current_path = file_info.path.clone();
                    (prog.processed_files, prog.total_files, prog.total_size)
                };

                // Send progress update via WebSocket (every 100 files to avoid spam)
                if processed % 100 == 0 {
                    let progress_percent = if total > 0 { (processed as f64 / total as f64) * 100.0 } else { 0.0 };
                    let _ = websocket_manager.update_scan_progress(
                        &session_id,
                        ScanProgressMessage {
                            scan_id: session_id.clone(),
                            disk_id: "unknown".to_string(),
                            scan_type: "quick".to_string(),
                            progress: progress_percent,
                            quick_scan_progress: Some(progress_percent),
                            deep_scan_progress: None,
                            remaining_time: 0, // TODO: Calculate estimate
                            files_scanned: processed,
                            total_files: total,
                            bytes_scanned: current_size,
                            total_bytes: current_size,
                            current_path: file_info.path.clone(),
                            scan_status: "running".to_string(),
                            errors: Vec::new(),
                        },
                    ).await;
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
    
    /// Calculate SHA256 hash for a file (async version)
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
    
    /// Calculate SHA256 hash for a file (sync version for parallel processing)
    fn calculate_file_hash_sync(path: &str) -> Result<String> {
        use std::fs::File;
        use std::io::Read;
        
        const BUFFER_SIZE: usize = 65536; // 64KB buffer
        
        let mut file = File::open(path)?;
        let mut hasher = Sha256::new();
        let mut buffer = vec![0u8; BUFFER_SIZE];
        
        loop {
            let bytes_read = file.read(&mut buffer)?;
            if bytes_read == 0 {
                break;
            }
            hasher.update(&buffer[..bytes_read]);
        }
        
        let result = hasher.finalize();
        Ok(format!("{:x}", result))
    }

    /// Update session phase
    async fn update_session_phase(&self, session_id: &str, phase: &str) -> Result<()> {
        {
            let mut sessions = self.active_sessions.write().await;
            if let Some(session) = sessions.get_mut(session_id) {
                session.progress.current_phase = phase.to_string();
            }
        }
        Ok(())
    }

    /// Complete scan session
    async fn complete_scan_session(&self, session_id: &str, results: ScanResults) -> Result<()> {
        {
            let mut sessions = self.active_sessions.write().await;
            if let Some(session) = sessions.get_mut(session_id) {
                session.status = ScanSessionStatus::Completed;
                session.completed_at = Some(chrono::Utc::now());
                session.results = Some(results);
                session.progress.overall_progress = 100.0;
                session.progress.current_phase = "completed".to_string();
            }
        }

        self.websocket_manager.complete_scan_session(session_id).await?;
        Ok(())
    }

    /// Estimate remaining time based on progress
    async fn estimate_remaining_time(&self, processed: usize, total: usize) -> u64 {
        if processed == 0 || total == 0 {
            return 0;
        }

        let start_time = self.scan_start_time.lock().await;
        if let Some(start) = *start_time {
            let elapsed = start.elapsed().as_secs();
            let progress_ratio = processed as f64 / total as f64;
            let estimated_total = elapsed as f64 / progress_ratio;
            let remaining = estimated_total - elapsed as f64;
            remaining.max(0.0) as u64
        } else {
            0
        }
    }
    
    /// Extract drive letter from path (Windows)
    #[cfg(target_os = "windows")]
    fn extract_drive_letter(path: &str) -> Result<String> {
        if let Some(first_char) = path.chars().next() {
            if first_char.is_ascii_alphabetic() {
                return Ok(first_char.to_string().to_uppercase());
            }
        }
        Err(anyhow::anyhow!("Could not extract drive letter from path: {}", path))
    }
    
    /// Check if file should be excluded based on config
    fn should_exclude_file(path: &str, config: &ScanConfig) -> bool {
        let path_lower = path.to_lowercase();
        
        // Check user-defined exclusions
        for pattern in &config.exclude_patterns {
            if path_lower.contains(&pattern.to_lowercase()) {
                return true;
            }
        }
        
        // Check if hidden files should be excluded
        if !config.include_hidden {
            if let Some(file_name) = std::path::Path::new(path).file_name() {
                if let Some(name_str) = file_name.to_str() {
                    if name_str.starts_with('.') {
                        return true;
                    }
                }
            }
        }
        
        false
    }
    
    /// Send MFT scan progress updates via WebSocket
    async fn send_mft_progress_updates(&self, session_id: &str, files: &[FileInfo]) {
        let file_count = files.len();
        let total_size: u64 = files.iter().map(|f| f.size).sum();
        
        // Send progress in chunks to show realistic progress
        let chunk_size = 1000;
        for (i, chunk) in files.chunks(chunk_size).enumerate() {
            let progress = ((i + 1) * chunk_size).min(file_count) as f64 / file_count as f64 * 100.0;
            
            let _ = self.websocket_manager.update_scan_progress(
                session_id,
                ScanProgressMessage {
                    scan_id: session_id.to_string(),
                    disk_id: "mft_scan".to_string(),
                    scan_type: "quick".to_string(),
                    progress,
                    quick_scan_progress: Some(progress),
                    deep_scan_progress: None,
                    remaining_time: 0, // MFT scan is very fast
                    files_scanned: ((i + 1) * chunk_size).min(file_count) as u64,
                    total_files: file_count as u64,
                    bytes_scanned: chunk.iter().map(|f| f.size).sum::<u64>(),
                    total_bytes: total_size,
                    current_path: chunk.first().map(|f| f.path.clone()).unwrap_or_default(),
                    scan_status: "running".to_string(),
                    errors: Vec::new(),
                },
            ).await;
            
            // Small delay to make progress visible
            tokio::time::sleep(Duration::from_millis(50)).await;
        }
    }

    /// Advanced duplicate detection with multiple strategies
    async fn find_duplicates_by_strategy(
        &self,
        files: &[FileInfo],
        config: &ScanConfig,
    ) -> Result<Vec<DuplicateGroup>> {
        match config.duplicate_strategy {
            DuplicateStrategy::HashOnly => self.find_duplicates_by_hash(files).await,
            DuplicateStrategy::NameAndSize => self.find_duplicates_by_name_size(files).await,
            DuplicateStrategy::NameSizePartialHash => self.find_duplicates_by_name_size_partial_hash(files).await,
            DuplicateStrategy::SmartDetection => self.find_duplicates_smart(files, config).await,
        }
    }

    /// Find duplicates by SHA-256 hash (most accurate)
    async fn find_duplicates_by_hash(&self, files: &[FileInfo]) -> Result<Vec<DuplicateGroup>> {
        let mut hash_groups: HashMap<String, Vec<FileInfo>> = HashMap::new();

        // Group files by hash
        for file in files {
            if let Some(hash) = &file.hash {
                hash_groups.entry(hash.clone()).or_insert_with(Vec::new).push(file.clone());
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

        duplicate_groups.sort_by(|a, b| b.potential_savings.cmp(&a.potential_savings));
        Ok(duplicate_groups)
    }

    /// Find duplicates by name and size (fast but less accurate)
    async fn find_duplicates_by_name_size(&self, files: &[FileInfo]) -> Result<Vec<DuplicateGroup>> {
        let mut name_size_groups: HashMap<String, Vec<FileInfo>> = HashMap::new();

        // Group files by name+size combination
        for file in files {
            let key = format!("{}:{}", file.name, file.size);
            name_size_groups.entry(key).or_insert_with(Vec::new).push(file.clone());
        }

        // Find groups with duplicates
        let mut duplicate_groups = Vec::new();
        for (key, group) in name_size_groups {
            if group.len() > 1 {
                let total_size: u64 = group.iter().map(|f| f.size).sum();
                let potential_savings = total_size - group[0].size;

                duplicate_groups.push(DuplicateGroup {
                    hash: key, // Use name:size as identifier
                    files: group,
                    total_size,
                    potential_savings,
                });
            }
        }

        duplicate_groups.sort_by(|a, b| b.potential_savings.cmp(&a.potential_savings));
        Ok(duplicate_groups)
    }

    /// Find duplicates by name, size and partial hash (balanced approach)
    async fn find_duplicates_by_name_size_partial_hash(&self, files: &[FileInfo]) -> Result<Vec<DuplicateGroup>> {
        let mut candidate_groups: HashMap<String, Vec<FileInfo>> = HashMap::new();

        // First pass: group by name+size
        for file in files {
            let key = format!("{}:{}", file.name, file.size);
            candidate_groups.entry(key).or_insert_with(Vec::new).push(file.clone());
        }

        // Second pass: calculate partial hash for candidates with multiple files
        let mut duplicate_groups = Vec::new();
        for (_, group) in candidate_groups {
            if group.len() > 1 {
                // Calculate partial hash for verification
                let verified_groups = self.verify_candidates_with_partial_hash(group).await?;
                duplicate_groups.extend(verified_groups);
            }
        }

        duplicate_groups.sort_by(|a, b| b.potential_savings.cmp(&a.potential_savings));
        Ok(duplicate_groups)
    }

    /// Smart duplicate detection (adaptive strategy)
    async fn find_duplicates_smart(&self, files: &[FileInfo], config: &ScanConfig) -> Result<Vec<DuplicateGroup>> {
        let mut all_duplicates = Vec::new();

        // Separate files by size thresholds
        let (small_files, medium_files, large_files): (Vec<_>, Vec<_>, Vec<_>) = files.iter()
            .cloned()
            .partition_into_three(|f| {
                if f.size < 1024 * 1024 { 0 } // < 1MB
                else if f.size < 100 * 1024 * 1024 { 1 } // < 100MB
                else { 2 } // >= 100MB
            });

        // Small files: Use name+size (fast)
        if !small_files.is_empty() {
            let small_duplicates = self.find_duplicates_by_name_size(&small_files).await?;
            all_duplicates.extend(small_duplicates);
        }

        // Medium files: Use name+size+partial hash (balanced)
        if !medium_files.is_empty() {
            let medium_duplicates = self.find_duplicates_by_name_size_partial_hash(&medium_files).await?;
            all_duplicates.extend(medium_duplicates);
        }

        // Large files: Use full hash if configured, otherwise name+size
        if !large_files.is_empty() {
            let large_duplicates = if config.calculate_hashes {
                self.find_duplicates_by_hash(&large_files).await?
            } else {
                self.find_duplicates_by_name_size(&large_files).await?
            };
            all_duplicates.extend(large_duplicates);
        }

        all_duplicates.sort_by(|a, b| b.potential_savings.cmp(&a.potential_savings));
        Ok(all_duplicates)
    }

    /// Verify candidate duplicates with partial hash
    async fn verify_candidates_with_partial_hash(&self, candidates: Vec<FileInfo>) -> Result<Vec<DuplicateGroup>> {
        let mut hash_groups: HashMap<String, Vec<FileInfo>> = HashMap::new();

        // Calculate partial hash for each candidate
        for file in candidates {
            if let Ok(partial_hash) = self.calculate_partial_hash(&file.path).await {
                let key = format!("{}:{}:{}", file.name, file.size, partial_hash);
                hash_groups.entry(key).or_insert_with(Vec::new).push(file);
            }
        }

        // Find verified duplicates
        let mut duplicate_groups = Vec::new();
        for (key, group) in hash_groups {
            if group.len() > 1 {
                let total_size: u64 = group.iter().map(|f| f.size).sum();
                let potential_savings = total_size - group[0].size;

                duplicate_groups.push(DuplicateGroup {
                    hash: key,
                    files: group,
                    total_size,
                    potential_savings,
                });
            }
        }

        Ok(duplicate_groups)
    }

    /// Calculate partial hash (first 64KB + last 64KB)
    async fn calculate_partial_hash(&self, path: &str) -> Result<String> {
        use tokio::fs::File;
        use tokio::io::{AsyncReadExt, AsyncSeekExt, SeekFrom};

        let mut file = File::open(path).await?;
        let metadata = file.metadata().await?;
        let file_size = metadata.len();

        let mut hasher = Sha256::new();

        // Read first 64KB
        let mut buffer = vec![0u8; 65536];
        let bytes_read = file.read(&mut buffer).await?;
        hasher.update(&buffer[..bytes_read]);

        // If file is large enough, also read last 64KB
        if file_size > 131072 { // 128KB
            file.seek(SeekFrom::End(-65536)).await?;
            let bytes_read = file.read(&mut buffer).await?;
            hasher.update(&buffer[..bytes_read]);
        }

        let result = hasher.finalize();
        Ok(format!("{:x}", result))
    }

    /// Advanced large file analysis
    async fn analyze_large_files(&self, files: &[FileInfo], config: &ScanConfig) -> Vec<FileInfo> {
        let mut large_files: Vec<FileInfo> = files.iter()
            .filter(|f| f.size >= config.large_file_threshold)
            .cloned()
            .collect();

        // Sort by size (largest first)
        large_files.sort_by(|a, b| b.size.cmp(&a.size));

        // Categorize by file type for better analysis
        let mut categorized = HashMap::new();
        for file in &large_files {
            let category = self.categorize_file(&file.name, &file.extension);
            categorized.entry(category).or_insert_with(Vec::new).push(file.clone());
        }

        // Return top files from each category (up to 1000 total)
        let mut result = Vec::new();
        let categories = ["videos", "archives", "databases", "images", "documents", "executables", "other"];
        
        for category in &categories {
            if let Some(category_files) = categorized.get(*category) {
                let take = std::cmp::min(category_files.len(), 150); // Limit per category
                result.extend(category_files.iter().take(take).cloned());
            }
        }

        result.truncate(1000); // Global limit
        result
    }

    /// Categorize file by extension and name patterns
    fn categorize_file(&self, name: &str, extension: &Option<String>) -> &'static str {
        let ext = extension.as_ref().map(|s| s.to_lowercase()).unwrap_or_default();
        let name_lower = name.to_lowercase();

        match ext.as_str() {
            "mp4" | "avi" | "mkv" | "mov" | "wmv" | "flv" | "webm" | "m4v" => "videos",
            "zip" | "rar" | "7z" | "tar" | "gz" | "bz2" | "xz" | "iso" => "archives",
            "db" | "sqlite" | "mdb" | "accdb" | "dbf" => "databases",
            "jpg" | "jpeg" | "png" | "bmp" | "tiff" | "webp" | "raw" | "psd" => "images",
            "pdf" | "doc" | "docx" | "ppt" | "pptx" | "xls" | "xlsx" => "documents",
            "exe" | "msi" | "dmg" | "deb" | "rpm" | "app" => "executables",
            _ => {
                if name_lower.contains("backup") || name_lower.contains("dump") {
                    "archives"
                } else if name_lower.contains("temp") || name_lower.contains("cache") {
                    "other"
                } else {
                    "other"
                }
            }
        }
    }
}

// Helper trait for three-way partitioning
trait PartitionIntoThree<T> {
    fn partition_into_three<F>(self, f: F) -> (Vec<T>, Vec<T>, Vec<T>)
    where
        F: Fn(&T) -> usize;
}

impl<T, I: Iterator<Item = T>> PartitionIntoThree<T> for I {
    fn partition_into_three<F>(self, f: F) -> (Vec<T>, Vec<T>, Vec<T>)
    where
        F: Fn(&T) -> usize,
    {
        let mut group0 = Vec::new();
        let mut group1 = Vec::new();
        let mut group2 = Vec::new();

        for item in self {
            match f(&item) {
                0 => group0.push(item),
                1 => group1.push(item),
                _ => group2.push(item),
            }
        }

        (group0, group1, group2)
    }
    
}