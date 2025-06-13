use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::State;
use anyhow::Result;

use crate::app_state::AppState;
use crate::disk_analyzer::{DiskAnalyzer, ScanType, ScanConfig, ScanSession, DualScanProgress, DuplicateStrategy};
use crate::commands::home_commands::{log_activity, ActivityType, ActivityMetadata};

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum DiskScanType {
    Quick,
    Deep,
    Custom,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ScanRequest {
    pub disk_id: String,
    pub scan_type: DiskScanType,
    pub exclude_patterns: Option<Vec<String>>,
    pub include_hidden: Option<bool>,
    pub calculate_hashes: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ScanResponse {
    pub session_id: String,
    pub message: String,
    pub success: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DiskStatus {
    pub id: String,
    pub name: String,
    pub status: String, // "idle", "scanning", "paused", "complete", "error"
    pub scan_type: Option<String>, // "quick", "deep"
    pub progress: f32,
    pub quick_scan_progress: Option<f32>,
    pub slow_scan_progress: Option<f32>,
    pub can_analyze_duplicates: bool,
    pub can_organize: bool,
    pub estimated_time_remaining: Option<u64>,
    pub current_path: Option<String>,
    pub files_scanned: u64,
    pub total_files: u64,
    pub is_paused: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SessionControl {
    pub success: bool,
    pub message: String,
}

/// Start a disk scan (new implementation)
#[tauri::command]
pub async fn scan_disk_new(
    scan_request: ScanRequest,
    state: State<'_, Arc<AppState>>,
) -> Result<ScanResponse, String> {
    let app_state = state.inner();
    
    // Check if analyzer exists, create if not
    let analyzer = {
        let current_analyzer = app_state.current_analyzer.read().await;
        if let Some(analyzer) = current_analyzer.as_ref() {
            analyzer.clone()
        } else {
            drop(current_analyzer);
            let mut current_analyzer = app_state.current_analyzer.write().await;
            let analyzer = DiskAnalyzer::new(app_state.websocket_manager.clone());
            *current_analyzer = Some(analyzer.clone());
            analyzer
        }
    };

    // Convert scan type
    let scan_type = match scan_request.scan_type {
        DiskScanType::Quick => ScanType::Quick,
        DiskScanType::Deep => ScanType::Deep,
        DiskScanType::Custom => ScanType::Custom,
    };

    // Create scan config
    let config = ScanConfig {
        exclude_patterns: scan_request.exclude_patterns.unwrap_or_else(|| {
            vec![
                "System Volume Information".to_string(),
                "$Recycle.Bin".to_string(),
                "Windows".to_string(),
                "Program Files".to_string(),
                "ProgramData".to_string(),
                "AppData".to_string(),
                "node_modules".to_string(),
                ".git".to_string(),
            ]
        }),
        include_hidden: scan_request.include_hidden.unwrap_or(false),
        follow_symlinks: false,
        max_depth: None,
        min_file_size: None,
        max_file_size: None,
        calculate_hashes: scan_request.calculate_hashes.unwrap_or(true),
        quick_hash_threshold: 1024 * 1024, // 1MB
        duplicate_strategy: DuplicateStrategy::SmartDetection,
        large_file_threshold: 100 * 1024 * 1024, // 100MB
    };

    // Get disk path from disk_id
    let disk_path = if scan_request.disk_id.len() == 1 {
        format!("{}:\\", scan_request.disk_id.to_uppercase())
    } else {
        scan_request.disk_id.clone()
    };

    // Create scan session
    let session_id = analyzer
        .create_scan_session(disk_path, scan_type, config)
        .await
        .map_err(|e| e.to_string())?;

    // Start the scan
    analyzer
        .start_scan_session(&session_id)
        .await
        .map_err(|e| e.to_string())?;

    // Log activity
    log_activity(
        app_state,
        "Escaneo de disco iniciado".to_string(),
        format!("Iniciando escaneo de disco {}", scan_request.disk_id),
        ActivityType::ScanStarted,
        "running".to_string(),
        Some(ActivityMetadata {
            size: None,
            count: None,
            duration: None,
            error: None,
        }),
    ).await;

    Ok(ScanResponse {
        session_id,
        message: format!("Escaneo iniciado en disco {}", scan_request.disk_id),
        success: true,
    })
}

/// Get scan progress for a session (new implementation)
#[tauri::command]
pub async fn get_scan_progress_new(
    session_id: String,
    state: State<'_, Arc<AppState>>,
) -> Result<Option<DualScanProgress>, String> {
    let app_state = state.inner();
    
    let analyzer = {
        let current_analyzer = app_state.current_analyzer.read().await;
        current_analyzer.as_ref().cloned()
    };

    if let Some(analyzer) = analyzer {
        if let Some(session) = analyzer.get_scan_session(&session_id).await {
            return Ok(Some(session.progress));
        }
    }

    Ok(None)
}

/// Get all disk statuses
#[tauri::command]
pub async fn get_disk_statuses(
    state: State<'_, Arc<AppState>>,
) -> Result<Vec<DiskStatus>, String> {
    let app_state = state.inner();
    
    // Get system disks
    let disks = crate::file_system::get_system_disks()
        .await
        .map_err(|e| e.to_string())?;

    let mut disk_statuses = Vec::new();

    // Get current analyzer to check for active scans
    let analyzer = {
        let current_analyzer = app_state.current_analyzer.read().await;
        current_analyzer.as_ref().cloned()
    };

    for disk in disks {
        let disk_id = disk.name.chars().next().unwrap_or('C').to_string();
        
        let mut status = DiskStatus {
            id: disk_id.clone(),
            name: disk.name,
            status: "idle".to_string(),
            scan_type: None,
            progress: 0.0,
            quick_scan_progress: Some(0.0),
            slow_scan_progress: Some(0.0),
            can_analyze_duplicates: false,
            can_organize: false,
            estimated_time_remaining: None,
            current_path: None,
            files_scanned: 0,
            total_files: 0,
            is_paused: false,
        };

        // Check if there's an active scan for this disk
        if let Some(ref analyzer) = analyzer {
            let sessions = analyzer.get_active_sessions().await;
            for session in sessions.values() {
                if session.disk_path.starts_with(&format!("{}:", disk_id)) {
                    match session.status {
                        crate::disk_analyzer::ScanSessionStatus::Running => {
                            status.status = "scanning".to_string();
                        }
                        crate::disk_analyzer::ScanSessionStatus::Paused => {
                            status.status = "paused".to_string();
                            status.is_paused = true;
                        }
                        crate::disk_analyzer::ScanSessionStatus::Completed => {
                            status.status = "complete".to_string();
                            status.can_analyze_duplicates = true;
                            status.can_organize = true;
                        }
                        crate::disk_analyzer::ScanSessionStatus::Error(_) => {
                            status.status = "error".to_string();
                        }
                        _ => {}
                    }

                    // Update progress information
                    status.progress = session.progress.overall_progress as f32;
                    status.quick_scan_progress = Some(
                        (session.progress.quick_scan.processed_files as f32 / 
                         session.progress.quick_scan.total_files.max(1) as f32) * 100.0
                    );
                    status.slow_scan_progress = Some(
                        (session.progress.deep_scan.processed_files as f32 / 
                         session.progress.deep_scan.total_files.max(1) as f32) * 100.0
                    );
                    status.files_scanned = session.progress.quick_scan.processed_files + 
                                         session.progress.deep_scan.processed_files;
                    status.total_files = session.progress.quick_scan.total_files + 
                                       session.progress.deep_scan.total_files;
                    status.current_path = Some(session.progress.quick_scan.current_path.clone());
                    
                    match session.scan_type {
                        crate::disk_analyzer::ScanType::Quick => {
                            status.scan_type = Some("quick".to_string());
                        }
                        crate::disk_analyzer::ScanType::Deep => {
                            status.scan_type = Some("deep".to_string());
                        }
                        crate::disk_analyzer::ScanType::Custom => {
                            status.scan_type = Some("custom".to_string());
                        }
                    }
                }
            }
        }

        disk_statuses.push(status);
    }

    Ok(disk_statuses)
}

/// Pause a scan session
#[tauri::command]
pub async fn pause_scan(
    session_id: String,
    state: State<'_, Arc<AppState>>,
) -> Result<SessionControl, String> {
    let app_state = state.inner();
    
    let analyzer = {
        let current_analyzer = app_state.current_analyzer.read().await;
        current_analyzer.as_ref().cloned()
    };

    if let Some(analyzer) = analyzer {
        analyzer
            .pause_scan_session(&session_id)
            .await
            .map_err(|e| e.to_string())?;

        return Ok(SessionControl {
            success: true,
            message: "Escaneo pausado".to_string(),
        });
    }

    Err("No hay analizador activo".to_string())
}

/// Resume a scan session
#[tauri::command]
pub async fn resume_scan(
    session_id: String,
    state: State<'_, Arc<AppState>>,
) -> Result<SessionControl, String> {
    let app_state = state.inner();
    
    let analyzer = {
        let current_analyzer = app_state.current_analyzer.read().await;
        current_analyzer.as_ref().cloned()
    };

    if let Some(analyzer) = analyzer {
        analyzer
            .resume_scan_session(&session_id)
            .await
            .map_err(|e| e.to_string())?;

        return Ok(SessionControl {
            success: true,
            message: "Escaneo reanudado".to_string(),
        });
    }

    Err("No hay analizador activo".to_string())
}

/// Cancel a scan session
#[tauri::command]
pub async fn cancel_scan(
    session_id: String,
    state: State<'_, Arc<AppState>>,
) -> Result<SessionControl, String> {
    let app_state = state.inner();
    
    let analyzer = {
        let current_analyzer = app_state.current_analyzer.read().await;
        current_analyzer.as_ref().cloned()
    };

    if let Some(analyzer) = analyzer {
        analyzer
            .cancel_scan_session(&session_id)
            .await
            .map_err(|e| e.to_string())?;

        // Log activity
        log_activity(
            app_state,
            "Escaneo cancelado".to_string(),
            format!("Escaneo {} cancelado por el usuario", session_id),
            ActivityType::ErrorOccurred,
            "cancelled".to_string(),
            None,
        ).await;

        return Ok(SessionControl {
            success: true,
            message: "Escaneo cancelado".to_string(),
        });
    }

    Err("No hay analizador activo".to_string())
}