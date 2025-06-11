use serde::{Deserialize, Serialize};
use tauri::State;
use anyhow::Result;
use crate::app_state::AppState;

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateInfo {
    pub version: String,
    pub release_notes: String,
    pub download_url: String,
    pub size: u64,
    pub is_mandatory: bool,
}

/// Check for updates
#[tauri::command]
pub async fn check_updates(
    state: State<'_, AppState>,
) -> Result<Option<UpdateInfo>, String> {
    let updater = state.updater.read().await;
    
    use update_module::UpdateStatus;
    
    match updater.check_for_updates().await {
        Ok(UpdateStatus::UpdateAvailable(update)) => Ok(Some(UpdateInfo {
            version: update.version.to_string(),
            release_notes: update.release_notes,
            download_url: update.download_url,
            size: update.size,
            is_mandatory: update.is_critical,
        })),
        Ok(UpdateStatus::UpToDate) => Ok(None),
        Ok(UpdateStatus::CheckFailed(msg)) => Err(msg),
        Err(e) => Err(e.to_string()),
    }
}