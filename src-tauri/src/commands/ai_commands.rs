use serde::{Deserialize, Serialize};
use tauri::State;
use anyhow::Result;
use crate::app_state::AppState;

#[derive(Debug, Serialize, Deserialize)]
pub struct AIAnalysisRequest {
    pub path: String,
    pub analysis_type: String, // "categorize", "suggest_cleanup", "identify_important"
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AIAnalysisResponse {
    pub suggestions: Vec<String>,
    pub categories: Vec<FileCategory>,
    pub confidence: f32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FileCategory {
    pub name: String,
    pub files: Vec<String>,
    pub reason: String,
}

/// Analyze files with AI
#[tauri::command]
pub async fn ai_analyze(
    request: AIAnalysisRequest,
    state: State<'_, AppState>,
) -> Result<AIAnalysisResponse, String> {
    let ai = state.ai.read().await;
    
    // Perform AI analysis based on type
    let response = match request.analysis_type.as_str() {
        "categorize" => {
            ai.categorize_files(&request.path)
                .await
                .map_err(|e| e.to_string())?
        }
        "suggest_cleanup" => {
            ai.suggest_cleanup(&request.path)
                .await
                .map_err(|e| e.to_string())?
        }
        "identify_important" => {
            ai.identify_important_files(&request.path)
                .await
                .map_err(|e| e.to_string())?
        }
        _ => return Err("Unknown analysis type".to_string()),
    };
    
    Ok(response)
}