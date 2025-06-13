use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::{broadcast, RwLock};
use serde::{Deserialize, Serialize};
use anyhow::Result;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebSocketMessage {
    pub message_type: String,
    pub data: serde_json::Value,
    pub timestamp: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanProgressMessage {
    pub scan_id: String,
    pub disk_id: String,
    pub scan_type: String, // "quick" or "deep"
    pub progress: f64,
    pub quick_scan_progress: Option<f64>,
    pub deep_scan_progress: Option<f64>,
    pub remaining_time: u64,
    pub files_scanned: u64,
    pub total_files: u64,
    pub bytes_scanned: u64,
    pub total_bytes: u64,
    pub current_path: String,
    pub scan_status: String, // "running", "paused", "completed", "error"
    pub errors: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanSessionMessage {
    pub session_id: String,
    pub disk_id: String,
    pub status: String, // "started", "paused", "resumed", "completed", "error"
    pub scan_type: String,
    pub message: String,
}

pub struct WebSocketManager {
    // Channel to broadcast messages to all connected clients
    tx: broadcast::Sender<WebSocketMessage>,
    // Store active scan sessions
    active_sessions: Arc<RwLock<HashMap<String, ScanSession>>>,
}

#[derive(Debug, Clone)]
pub struct ScanSession {
    pub id: String,
    pub disk_id: String,
    pub scan_type: String,
    pub status: String,
    pub started_at: chrono::DateTime<chrono::Utc>,
    pub paused_at: Option<chrono::DateTime<chrono::Utc>>,
    pub completed_at: Option<chrono::DateTime<chrono::Utc>>,
    pub progress: f64,
    pub quick_scan_progress: Option<f64>,
    pub deep_scan_progress: Option<f64>,
    pub files_scanned: u64,
    pub total_files: u64,
    pub bytes_scanned: u64,
    pub total_bytes: u64,
    pub current_path: String,
    pub errors: Vec<String>,
}

impl WebSocketManager {
    pub fn new() -> Self {
        let (tx, _) = broadcast::channel(1000);
        Self {
            tx,
            active_sessions: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Get a receiver for WebSocket messages
    pub fn subscribe(&self) -> broadcast::Receiver<WebSocketMessage> {
        self.tx.subscribe()
    }

    /// Start a new scan session
    pub async fn start_scan_session(
        &self,
        disk_id: String,
        scan_type: String,
    ) -> Result<String> {
        let session_id = Uuid::new_v4().to_string();
        let session = ScanSession {
            id: session_id.clone(),
            disk_id: disk_id.clone(),
            scan_type: scan_type.clone(),
            status: "started".to_string(),
            started_at: chrono::Utc::now(),
            paused_at: None,
            completed_at: None,
            progress: 0.0,
            quick_scan_progress: Some(0.0),
            deep_scan_progress: if scan_type == "deep" { Some(0.0) } else { None },
            files_scanned: 0,
            total_files: 0,
            bytes_scanned: 0,
            total_bytes: 0,
            current_path: String::new(),
            errors: Vec::new(),
        };

        // Store the session
        {
            let mut sessions = self.active_sessions.write().await;
            sessions.insert(session_id.clone(), session);
        }

        // Broadcast session started message
        self.broadcast_session_message(ScanSessionMessage {
            session_id: session_id.clone(),
            disk_id,
            status: "started".to_string(),
            scan_type,
            message: "Scan session started".to_string(),
        }).await?;

        Ok(session_id)
    }

    /// Update scan progress
    pub async fn update_scan_progress(
        &self,
        session_id: &str,
        progress: ScanProgressMessage,
    ) -> Result<()> {
        // Update the session
        {
            let mut sessions = self.active_sessions.write().await;
            if let Some(session) = sessions.get_mut(session_id) {
                session.progress = progress.progress;
                session.quick_scan_progress = progress.quick_scan_progress;
                session.deep_scan_progress = progress.deep_scan_progress;
                session.files_scanned = progress.files_scanned;
                session.total_files = progress.total_files;
                session.bytes_scanned = progress.bytes_scanned;
                session.total_bytes = progress.total_bytes;
                session.current_path = progress.current_path.clone();
                session.errors = progress.errors.clone();
                session.status = progress.scan_status.clone();

                if progress.scan_status == "completed" {
                    session.completed_at = Some(chrono::Utc::now());
                }
            }
        }

        // Broadcast progress update
        self.broadcast_progress_message(progress).await?;

        Ok(())
    }

    /// Pause a scan session
    pub async fn pause_scan_session(&self, session_id: &str) -> Result<()> {
        {
            let mut sessions = self.active_sessions.write().await;
            if let Some(session) = sessions.get_mut(session_id) {
                session.status = "paused".to_string();
                session.paused_at = Some(chrono::Utc::now());
            }
        }

        self.broadcast_session_message(ScanSessionMessage {
            session_id: session_id.to_string(),
            disk_id: self.get_session_disk_id(session_id).await.unwrap_or_default(),
            status: "paused".to_string(),
            scan_type: self.get_session_scan_type(session_id).await.unwrap_or_default(),
            message: "Scan paused".to_string(),
        }).await?;

        Ok(())
    }

    /// Resume a scan session
    pub async fn resume_scan_session(&self, session_id: &str) -> Result<()> {
        {
            let mut sessions = self.active_sessions.write().await;
            if let Some(session) = sessions.get_mut(session_id) {
                session.status = "running".to_string();
                session.paused_at = None;
            }
        }

        self.broadcast_session_message(ScanSessionMessage {
            session_id: session_id.to_string(),
            disk_id: self.get_session_disk_id(session_id).await.unwrap_or_default(),
            status: "resumed".to_string(),
            scan_type: self.get_session_scan_type(session_id).await.unwrap_or_default(),
            message: "Scan resumed".to_string(),
        }).await?;

        Ok(())
    }

    /// Complete a scan session
    pub async fn complete_scan_session(&self, session_id: &str) -> Result<()> {
        {
            let mut sessions = self.active_sessions.write().await;
            if let Some(session) = sessions.get_mut(session_id) {
                session.status = "completed".to_string();
                session.completed_at = Some(chrono::Utc::now());
            }
        }

        self.broadcast_session_message(ScanSessionMessage {
            session_id: session_id.to_string(),
            disk_id: self.get_session_disk_id(session_id).await.unwrap_or_default(),
            status: "completed".to_string(),
            scan_type: self.get_session_scan_type(session_id).await.unwrap_or_default(),
            message: "Scan completed".to_string(),
        }).await?;

        Ok(())
    }

    /// Get all active sessions
    pub async fn get_active_sessions(&self) -> HashMap<String, ScanSession> {
        self.active_sessions.read().await.clone()
    }

    /// Get a specific session
    pub async fn get_session(&self, session_id: &str) -> Option<ScanSession> {
        self.active_sessions.read().await.get(session_id).cloned()
    }

    /// Remove a completed session
    pub async fn remove_session(&self, session_id: &str) -> Result<()> {
        let mut sessions = self.active_sessions.write().await;
        sessions.remove(session_id);
        Ok(())
    }

    /// Helper to get session disk ID
    async fn get_session_disk_id(&self, session_id: &str) -> Option<String> {
        self.active_sessions
            .read()
            .await
            .get(session_id)
            .map(|s| s.disk_id.clone())
    }

    /// Helper to get session scan type
    async fn get_session_scan_type(&self, session_id: &str) -> Option<String> {
        self.active_sessions
            .read()
            .await
            .get(session_id)
            .map(|s| s.scan_type.clone())
    }

    /// Broadcast a progress message
    async fn broadcast_progress_message(&self, progress: ScanProgressMessage) -> Result<()> {
        let message = WebSocketMessage {
            message_type: "scan_progress".to_string(),
            data: serde_json::to_value(progress)?,
            timestamp: chrono::Utc::now(),
        };

        // Send to all subscribers (ignore if no receivers)
        let _ = self.tx.send(message);
        Ok(())
    }

    /// Broadcast a session message
    async fn broadcast_session_message(&self, session: ScanSessionMessage) -> Result<()> {
        let message = WebSocketMessage {
            message_type: "scan_session".to_string(),
            data: serde_json::to_value(session)?,
            timestamp: chrono::Utc::now(),
        };

        // Send to all subscribers (ignore if no receivers)
        let _ = self.tx.send(message);
        Ok(())
    }

    /// Broadcast a generic message
    pub async fn broadcast_message(&self, message_type: String, data: serde_json::Value) -> Result<()> {
        let message = WebSocketMessage {
            message_type,
            data,
            timestamp: chrono::Utc::now(),
        };

        let _ = self.tx.send(message);
        Ok(())
    }
}

impl Default for WebSocketManager {
    fn default() -> Self {
        Self::new()
    }
}