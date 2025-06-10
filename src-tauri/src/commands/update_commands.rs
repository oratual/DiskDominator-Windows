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
    
    match updater.check_for_updates().await {
        Ok(Some(update)) => Ok(Some(UpdateInfo {
            version: update.version,
            release_notes: update.changelog,
            download_url: update.url,
            size: update.size,
            is_mandatory: update.mandatory,
        })),
        Ok(None) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}