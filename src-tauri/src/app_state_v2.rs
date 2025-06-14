use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::RwLock;
use crate::error::{DiskDominatorError, DiskResult};

#[derive(Debug, Clone, Serialize)]
#[serde(tag = "phase")]
pub enum AppPhase {
    Initializing {
        message: String,
    },
    Ready {
        #[serde(flatten)]
        state: ReadyState,
    },
    Scanning {
        #[serde(flatten)]
        state: ScanState,
    },
    Error {
        error: String,
        recoverable: bool,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReadyState {
    pub disks_detected: u32,
    pub last_scan: Option<chrono::DateTime<chrono::Utc>>,
    pub total_system_space: u64,
    pub available_system_space: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanState {
    pub session_id: String,
    pub disk_id: String,
    pub scan_type: String,
    pub progress: f32,
    pub files_scanned: u64,
    pub started_at: chrono::DateTime<chrono::Utc>,
}

pub struct AppStateV2 {
    phase: Arc<RwLock<AppPhase>>,
    activities: Arc<RwLock<Vec<Activity>>>,
    scan_history: Arc<RwLock<Vec<ScanRecord>>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Activity {
    pub id: String,
    pub timestamp: chrono::DateTime<chrono::Utc>,
    pub title: String,
    pub description: String,
    pub activity_type: String,
    pub status: String,
    pub metadata: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanRecord {
    pub session_id: String,
    pub disk_id: String,
    pub scan_type: String,
    pub started_at: chrono::DateTime<chrono::Utc>,
    pub completed_at: Option<chrono::DateTime<chrono::Utc>>,
    pub files_found: u64,
    pub total_size: u64,
    pub error: Option<String>,
}

impl AppStateV2 {
    pub fn new() -> Self {
        tracing::debug!("Creating new AppStateV2");
        
        Self {
            phase: Arc::new(RwLock::new(AppPhase::Initializing {
                message: "Starting DiskDominator...".to_string(),
            })),
            activities: Arc::new(RwLock::new(Vec::new())),
            scan_history: Arc::new(RwLock::new(Vec::new())),
        }
    }
    
    pub async fn transition_to_ready(&self, ready_state: ReadyState) -> DiskResult<()> {
        let mut phase = self.phase.write().await;
        
        match &*phase {
            AppPhase::Initializing { .. } => {
                tracing::info!("Transitioning to Ready state");
                *phase = AppPhase::Ready { state: ready_state };
                Ok(())
            }
            _ => Err(DiskDominatorError::InvalidConfig(
                "Cannot transition to Ready from current state".to_string()
            ))
        }
    }
    
    pub async fn start_scan(&self, scan_state: ScanState) -> DiskResult<()> {
        let mut phase = self.phase.write().await;
        
        match &*phase {
            AppPhase::Ready { .. } => {
                tracing::info!(
                    session_id = %scan_state.session_id,
                    disk_id = %scan_state.disk_id,
                    scan_type = %scan_state.scan_type,
                    "Starting disk scan"
                );
                
                // Guardar en historial
                let record = ScanRecord {
                    session_id: scan_state.session_id.clone(),
                    disk_id: scan_state.disk_id.clone(),
                    scan_type: scan_state.scan_type.clone(),
                    started_at: scan_state.started_at,
                    completed_at: None,
                    files_found: 0,
                    total_size: 0,
                    error: None,
                };
                
                self.scan_history.write().await.push(record);
                
                *phase = AppPhase::Scanning { state: scan_state };
                Ok(())
            }
            _ => Err(DiskDominatorError::InvalidConfig(
                "Cannot start scan from current state".to_string()
            ))
        }
    }
    
    pub async fn update_scan_progress(&self, progress: f32, files_scanned: u64) -> DiskResult<()> {
        let mut phase = self.phase.write().await;
        
        match &mut *phase {
            AppPhase::Scanning { state } => {
                state.progress = progress;
                state.files_scanned = files_scanned;
                
                tracing::debug!(
                    progress = %progress,
                    files_scanned = %files_scanned,
                    "Scan progress updated"
                );
                
                Ok(())
            }
            _ => Err(DiskDominatorError::InvalidConfig(
                "Not in scanning state".to_string()
            ))
        }
    }
    
    pub async fn complete_scan(&self, files_found: u64, total_size: u64) -> DiskResult<ReadyState> {
        let mut phase = self.phase.write().await;
        
        match &*phase {
            AppPhase::Scanning { state } => {
                let session_id = state.session_id.clone();
                
                // Actualizar historial
                let mut history = self.scan_history.write().await;
                if let Some(record) = history.iter_mut().find(|r| r.session_id == session_id) {
                    record.completed_at = Some(chrono::Utc::now());
                    record.files_found = files_found;
                    record.total_size = total_size;
                }
                
                // Obtener información del sistema para el estado Ready
                let ready_state = ReadyState {
                    disks_detected: 0, // Se actualizará después
                    last_scan: Some(chrono::Utc::now()),
                    total_system_space: 0,
                    available_system_space: 0,
                };
                
                tracing::info!(
                    session_id = %session_id,
                    files_found = %files_found,
                    total_size = %total_size,
                    "Scan completed successfully"
                );
                
                *phase = AppPhase::Ready { state: ready_state.clone() };
                Ok(ready_state)
            }
            _ => Err(DiskDominatorError::InvalidConfig(
                "Not in scanning state".to_string()
            ))
        }
    }
    
    pub async fn handle_error(&self, error: DiskDominatorError, recoverable: bool) {
        let mut phase = self.phase.write().await;
        
        tracing::error!(
            error = ?error,
            recoverable = %recoverable,
            "Application error occurred"
        );
        
        // Si estamos escaneando, actualizar el historial
        if let AppPhase::Scanning { state } = &*phase {
            let session_id = state.session_id.clone();
            let mut history = self.scan_history.write().await;
            if let Some(record) = history.iter_mut().find(|r| r.session_id == session_id) {
                record.error = Some(error.to_string());
                record.completed_at = Some(chrono::Utc::now());
            }
        }
        
        *phase = AppPhase::Error {
            error: error.to_string(),
            recoverable,
        };
    }
    
    pub async fn get_current_phase(&self) -> AppPhase {
        self.phase.read().await.clone()
    }
    
    pub async fn add_activity(&self, activity: Activity) {
        let mut activities = self.activities.write().await;
        activities.push(activity);
        
        // Mantener solo las últimas 100 actividades
        if activities.len() > 100 {
            activities.drain(0..activities.len() - 100);
        }
    }
    
    pub async fn get_recent_activities(&self, limit: usize) -> Vec<Activity> {
        let activities = self.activities.read().await;
        activities.iter()
            .rev()
            .take(limit)
            .cloned()
            .collect()
    }
    
    pub async fn get_scan_history(&self) -> Vec<ScanRecord> {
        self.scan_history.read().await.clone()
    }
}