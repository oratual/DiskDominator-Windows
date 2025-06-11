use serde::{Deserialize, Serialize};
use tauri::State;
use anyhow::Result;
use crate::app_state::AppState;
use auth_module::{Credentials, User};

#[derive(Debug, Serialize, Deserialize)]
pub struct LoginRequest {
    pub username: String,
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LoginResponse {
    pub success: bool,
    pub user: Option<User>,
    pub token: Option<String>,
}

/// Login user
#[tauri::command]
pub async fn auth_login(
    credentials: LoginRequest,
    state: State<'_, AppState>,
) -> Result<LoginResponse, String> {
    let mut auth = state.auth.write().await;
    
    let creds = Credentials {
        username: credentials.username,
        password: credentials.password,
    };
    
    match auth.login(creds).await {
        Ok(user) => {
            let token = auth.get_session_token()
                .await
                .map_err(|e| e.to_string())?;
            
            Ok(LoginResponse {
                success: true,
                user: Some(user),
                token: Some(token),
            })
        }
        Err(e) => Ok(LoginResponse {
            success: false,
            user: None,
            token: None,
        })
    }
}

/// Logout user
#[tauri::command]
pub async fn auth_logout(
    state: State<'_, AppState>,
) -> Result<bool, String> {
    let mut auth = state.auth.write().await;
    
    // For now, use a mock session id
    auth.logout("mock-session-id")
        .await
        .map_err(|e| e.to_string())?;
    
    Ok(true)
}