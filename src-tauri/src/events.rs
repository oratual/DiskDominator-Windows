use serde::{Deserialize, Serialize};
use tauri::{Manager, Window};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "payload")]
pub enum AppEvent {
    ScanProgress(ScanProgressEvent),
    FileOperationComplete(FileOperationEvent),
    DuplicateFound(DuplicateFoundEvent),
    AIAnalysisComplete(AIAnalysisEvent),
    Error(ErrorEvent),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanProgressEvent {
    pub scan_id: String,
    pub current_path: String,
    pub files_scanned: u64,
    pub bytes_scanned: u64,
    pub percentage: f32,
    pub estimated_remaining: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileOperationEvent {
    pub operation_id: String,
    pub operation_type: String,
    pub source: String,
    pub destination: Option<String>,
    pub success: bool,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DuplicateFoundEvent {
    pub scan_id: String,
    pub hash: String,
    pub files: Vec<String>,
    pub total_size: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AIAnalysisEvent {
    pub analysis_id: String,
    pub analysis_type: String,
    pub path: String,
    pub suggestions_count: usize,
    pub confidence: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ErrorEvent {
    pub error_type: String,
    pub message: String,
    pub context: Option<String>,
}

/// Event emitter for sending events to the frontend
pub struct EventEmitter {
    window: Window,
}

impl EventEmitter {
    pub fn new(window: Window) -> Self {
        Self { window }
    }
    
    pub fn emit(&self, event: AppEvent) -> Result<(), tauri::Error> {
        match &event {
            AppEvent::ScanProgress(_) => {
                self.window.emit("scan-progress", &event)
            }
            AppEvent::FileOperationComplete(_) => {
                self.window.emit("file-operation-complete", &event)
            }
            AppEvent::DuplicateFound(_) => {
                self.window.emit("duplicate-found", &event)
            }
            AppEvent::AIAnalysisComplete(_) => {
                self.window.emit("ai-analysis-complete", &event)
            }
            AppEvent::Error(_) => {
                self.window.emit("app-error", &event)
            }
        }
    }
    
    pub fn emit_scan_progress(
        &self,
        scan_id: String,
        current_path: String,
        files_scanned: u64,
        bytes_scanned: u64,
        percentage: f32,
    ) -> Result<(), tauri::Error> {
        let event = AppEvent::ScanProgress(ScanProgressEvent {
            scan_id,
            current_path,
            files_scanned,
            bytes_scanned,
            percentage,
            estimated_remaining: None,
        });
        self.emit(event)
    }
    
    pub fn emit_error(&self, error_type: &str, message: &str) -> Result<(), tauri::Error> {
        let event = AppEvent::Error(ErrorEvent {
            error_type: error_type.to_string(),
            message: message.to_string(),
            context: None,
        });
        self.emit(event)
    }
}

/// Progress tracker for long-running operations
pub struct ProgressTracker {
    emitter: EventEmitter,
    scan_id: String,
    total_items: u64,
    processed_items: u64,
    start_time: std::time::Instant,
}

impl ProgressTracker {
    pub fn new(emitter: EventEmitter, scan_id: String, total_items: u64) -> Self {
        Self {
            emitter,
            scan_id,
            total_items,
            processed_items: 0,
            start_time: std::time::Instant::now(),
        }
    }
    
    pub fn update(&mut self, current_path: &str, bytes_processed: u64) {
        self.processed_items += 1;
        let percentage = if self.total_items > 0 {
            (self.processed_items as f32 / self.total_items as f32) * 100.0
        } else {
            0.0
        };
        
        let _ = self.emitter.emit_scan_progress(
            self.scan_id.clone(),
            current_path.to_string(),
            self.processed_items,
            bytes_processed,
            percentage,
        );
    }
    
    pub fn complete(&self) {
        let duration = self.start_time.elapsed();
        tracing::info!(
            "Operation {} completed in {:?}",
            self.scan_id,
            duration
        );
    }
}