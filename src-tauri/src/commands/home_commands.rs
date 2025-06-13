use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::State;
use chrono::{DateTime, Utc};

use crate::app_state::AppState;
use crate::file_system;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct DiskSummary {
    pub id: String,
    pub label: String,
    pub path: String,
    pub used: u64,
    pub total: u64,
    pub free: u64,
    pub percentage: f32,
    pub file_system: Option<String>,
    pub last_scanned: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SystemOverview {
    pub disks: Vec<DiskSummary>,
    pub total_disk_space: u64,
    pub total_used_space: u64,
    pub total_free_space: u64,
    pub duplicates_found: u32,
    pub space_recoverable: u64,
    pub large_files_count: u32,
    pub last_full_scan: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ActivityType {
    ScanStarted,
    ScanCompleted,
    DuplicatesFound,
    FilesDeleted,
    FilesMoved,
    DiskOrganized,
    ErrorOccurred,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Activity {
    pub id: String,
    pub action: String,
    pub target: String,
    pub time: DateTime<Utc>,
    pub activity_type: ActivityType,
    pub status: String,
    pub metadata: Option<ActivityMetadata>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActivityMetadata {
    pub size: Option<u64>,
    pub count: Option<u32>,
    pub duration: Option<u32>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum QuickActionType {
    ScanDisk,
    FindDuplicates,
    LargeFiles,
    OrganizeDisk,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct QuickActionResult {
    pub success: bool,
    pub message: String,
    pub action_type: QuickActionType,
}

/// Helper function to create and log activity
pub async fn log_activity(
    state: &Arc<AppState>,
    action: String,
    target: String,
    activity_type: ActivityType,
    status: String,
    metadata: Option<ActivityMetadata>,
) {
    let activity = Activity {
        id: Uuid::new_v4().to_string(),
        action,
        target,
        time: Utc::now(),
        activity_type,
        status,
        metadata,
    };
    
    state.add_activity(activity).await;
}

#[tauri::command]
pub async fn get_system_overview(
    state: State<'_, Arc<AppState>>,
) -> Result<SystemOverview, String> {
    // Get disk information
    let disks = file_system::get_system_disks()
        .await
        .map_err(|e| e.to_string())?;
    
    // Convert to DiskSummary format
    let mut disk_summaries = Vec::new();
    let mut total_disk_space = 0u64;
    let mut total_used_space = 0u64;
    let mut total_free_space = 0u64;
    
    for disk in disks {
        let used = disk.total_space.saturating_sub(disk.available_space);
        let percentage = if disk.total_space > 0 {
            (used as f64 / disk.total_space as f64 * 100.0) as f32
        } else {
            0.0
        };
        
        total_disk_space += disk.total_space;
        total_used_space += used;
        total_free_space += disk.available_space;
        
        disk_summaries.push(DiskSummary {
            id: disk.name.chars().take(1).collect::<String>().to_uppercase(),
            label: disk.name.clone(),
            path: disk.mount_point.clone(),
            used,
            total: disk.total_space,
            free: disk.available_space,
            percentage,
            file_system: Some(disk.file_system.clone()),
            last_scanned: None, // TODO: Get from scan history
        });
    }
    
    // Get additional statistics from app state
    let _app_state = state.inner();
    // TODO: Implement scan state tracking
    // let scan_state = app_state.scan_state.lock().await;
    
    // TODO: These would come from actual scan results and database
    let duplicates_found = 0;
    let space_recoverable = 0;
    let large_files_count = 0;
    let last_full_scan = None;
    
    Ok(SystemOverview {
        disks: disk_summaries,
        total_disk_space,
        total_used_space,
        total_free_space,
        duplicates_found,
        space_recoverable,
        large_files_count,
        last_full_scan,
    })
}

#[tauri::command]
pub async fn get_recent_activity(
    limit: Option<u32>,
    state: State<'_, Arc<AppState>>,
) -> Result<Vec<Activity>, String> {
    let activity_limit = limit.unwrap_or(50);
    
    // Get real activity from app state
    let app_state = state.inner();
    let activity_log = app_state.activity_log.read().await;
    
    // If no activities exist, return empty vec instead of mock data
    if activity_log.is_empty() {
        return Ok(Vec::new());
    }
    
    // Convert to Vec and sort by time (most recent first)
    let mut activities: Vec<Activity> = activity_log.values().cloned().collect();
    activities.sort_by(|a, b| b.time.cmp(&a.time));
    
    // Limit results
    activities.truncate(activity_limit as usize);
    
    Ok(activities)
}

#[tauri::command]
pub async fn execute_quick_action(
    action_type: QuickActionType,
    state: State<'_, Arc<AppState>>,
) -> Result<QuickActionResult, String> {
    match action_type {
        QuickActionType::ScanDisk => {
            // Log the start of disk scan action
            log_activity(
                state.inner(),
                "Análisis de discos iniciado".to_string(),
                "Iniciando escaneo del sistema".to_string(),
                ActivityType::ScanStarted,
                "running".to_string(),
                None,
            ).await;
            
            // Return success - the frontend will navigate to the scan view
            Ok(QuickActionResult {
                success: true,
                message: "Navegando a la vista de análisis de discos...".to_string(),
                action_type,
            })
        }
        QuickActionType::FindDuplicates => {
            // Navigate to duplicates view
            Ok(QuickActionResult {
                success: true,
                message: "Navegando a la vista de duplicados...".to_string(),
                action_type,
            })
        }
        QuickActionType::LargeFiles => {
            // Navigate to large files view
            Ok(QuickActionResult {
                success: true,
                message: "Navegando a la vista de archivos grandes...".to_string(),
                action_type,
            })
        }
        QuickActionType::OrganizeDisk => {
            // Navigate to organize view
            Ok(QuickActionResult {
                success: true,
                message: "Navegando a la vista de organización...".to_string(),
                action_type,
            })
        }
    }
}

#[tauri::command]
pub async fn refresh_dashboard(
    _state: State<'_, Arc<AppState>>,
) -> Result<SystemOverview, String> {
    // Force refresh all dashboard data
    // This could trigger background updates as well
    get_system_overview(_state).await
}