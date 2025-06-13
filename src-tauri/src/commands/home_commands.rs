use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::State;
use chrono::{DateTime, Utc};

use crate::app_state::AppState;
use crate::file_system;

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

#[derive(Debug, Serialize, Deserialize)]
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

#[derive(Debug, Serialize, Deserialize)]
pub struct Activity {
    pub id: String,
    pub action: String,
    pub target: String,
    pub time: DateTime<Utc>,
    pub activity_type: ActivityType,
    pub status: String,
    pub metadata: Option<ActivityMetadata>,
}

#[derive(Debug, Serialize, Deserialize)]
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
    _state: State<'_, Arc<AppState>>,
) -> Result<Vec<Activity>, String> {
    let activity_limit = limit.unwrap_or(5);
    
    // TODO: Implement actual activity logging and retrieval
    // For now, return mock data
    let mut activities = Vec::new();
    
    // Mock recent activities
    if activity_limit > 0 {
        activities.push(Activity {
            id: "1".to_string(),
            action: "Escaneo completado".to_string(),
            target: "Disco C:".to_string(),
            time: Utc::now() - chrono::Duration::hours(2),
            activity_type: ActivityType::ScanCompleted,
            status: "success".to_string(),
            metadata: Some(ActivityMetadata {
                size: Some(500_000_000_000),
                count: Some(150_000),
                duration: Some(180),
                error: None,
            }),
        });
    }
    
    if activity_limit > 1 {
        activities.push(Activity {
            id: "2".to_string(),
            action: "Duplicados encontrados".to_string(),
            target: "120 archivos (4.5 GB)".to_string(),
            time: Utc::now() - chrono::Duration::hours(2) - chrono::Duration::minutes(5),
            activity_type: ActivityType::DuplicatesFound,
            status: "success".to_string(),
            metadata: Some(ActivityMetadata {
                size: Some(4_500_000_000),
                count: Some(120),
                duration: None,
                error: None,
            }),
        });
    }
    
    if activity_limit > 2 {
        activities.push(Activity {
            id: "3".to_string(),
            action: "Archivos organizados".to_string(),
            target: "Documentos".to_string(),
            time: Utc::now() - chrono::Duration::days(1),
            activity_type: ActivityType::DiskOrganized,
            status: "success".to_string(),
            metadata: Some(ActivityMetadata {
                size: None,
                count: Some(450),
                duration: Some(45),
                error: None,
            }),
        });
    }
    
    Ok(activities)
}

#[tauri::command]
pub async fn execute_quick_action(
    action_type: QuickActionType,
    _state: State<'_, Arc<AppState>>,
) -> Result<QuickActionResult, String> {
    match action_type {
        QuickActionType::ScanDisk => {
            // Trigger disk scan
            // This would typically navigate to the disk scan view or start a scan
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