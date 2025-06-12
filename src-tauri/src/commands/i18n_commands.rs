// Temporarily commented out until i18n_module is available
/*
use tauri::State;
use anyhow::Result;
use crate::app_state::AppState;

/// Set application language
#[tauri::command]
pub async fn set_language(
    language: String,
    state: State<'_, AppState>,
) -> Result<bool, String> {
    let mut i18n = state.i18n.write().await;
    
    i18n.set_language(&language);
    
    Ok(true)
}
*/